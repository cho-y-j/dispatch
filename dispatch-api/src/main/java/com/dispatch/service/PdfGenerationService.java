package com.dispatch.service;

import com.dispatch.entity.DispatchMatch;
import com.dispatch.entity.DispatchRequest;
import com.dispatch.entity.Driver;
import com.dispatch.entity.Equipment;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfGenerationService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(37, 99, 235); // Blue
    private static final DeviceRgb HEADER_BG_COLOR = new DeviceRgb(243, 244, 246); // Gray-100
    private static final DeviceRgb BORDER_COLOR = new DeviceRgb(209, 213, 219); // Gray-300

    /**
     * 작업 확인서 PDF 생성
     */
    public String generateWorkReport(DispatchMatch match) throws IOException {
        DispatchRequest request = match.getRequest();
        Driver driver = match.getDriver();
        Equipment equipment = match.getEquipment();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc, PageSize.A4);
        document.setMargins(40, 40, 40, 40);

        try {
            // 시스템 폰트 사용 (한글 지원)
            PdfFont font = createKoreanFont();

            // 1. 제목
            addTitle(document, font);

            // 2. 문서 정보
            addDocumentInfo(document, font, match);

            // 3. 배차 정보
            addDispatchInfo(document, font, request);

            // 4. 장비 정보
            addEquipmentInfo(document, font, equipment, driver);

            // 5. 작업 내용
            addWorkDetails(document, font, request, match);

            // 6. 요금 정보
            addPriceInfo(document, font, request, match);

            // 7. 서명
            addSignatures(document, font, match);

            // 8. 푸터
            addFooter(document, font);

            document.close();

            // 파일 저장
            String fileName = "work-report-" + match.getId() + "-" + UUID.randomUUID().toString().substring(0, 8) + ".pdf";
            Path pdfDir = Paths.get(uploadDir, "reports");
            Files.createDirectories(pdfDir);
            Path filePath = pdfDir.resolve(fileName);
            Files.write(filePath, baos.toByteArray());

            log.info("Work report PDF generated: {}", filePath);
            return "/uploads/reports/" + fileName;

        } catch (Exception e) {
            log.error("Failed to generate PDF: {}", e.getMessage(), e);
            throw new IOException("PDF 생성 실패: " + e.getMessage(), e);
        }
    }

    private PdfFont createKoreanFont() throws IOException {
        // 기본 폰트 사용 (한글이 깨질 수 있음 - 실제 환경에서는 한글 폰트 파일 필요)
        try {
            // macOS 기본 한글 폰트 시도
            return PdfFontFactory.createFont("/System/Library/Fonts/AppleSDGothicNeo.ttc,0", PdfEncodings.IDENTITY_H);
        } catch (Exception e) {
            try {
                // Windows 기본 한글 폰트 시도
                return PdfFontFactory.createFont("C:/Windows/Fonts/malgun.ttf", PdfEncodings.IDENTITY_H);
            } catch (Exception e2) {
                // Linux/Docker 환경 - 기본 폰트 사용
                log.warn("Korean font not found, using default font");
                return PdfFontFactory.createFont();
            }
        }
    }

    private void addTitle(Document document, PdfFont font) {
        Paragraph title = new Paragraph("작 업 확 인 서")
                .setFont(font)
                .setFontSize(24)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
        document.add(title);

        Paragraph subtitle = new Paragraph("Work Confirmation Report")
                .setFont(font)
                .setFontSize(12)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(30);
        document.add(subtitle);
    }

    private void addDocumentInfo(Document document, PdfFont font, DispatchMatch match) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .useAllAvailableWidth()
                .setMarginBottom(20);

        table.addCell(createInfoCell("문서번호", "WR-" + String.format("%06d", match.getId()), font));
        table.addCell(createInfoCell("발행일시", LocalDateTime.now().format(DATETIME_FORMATTER), font));

        document.add(table);
    }

    private Cell createInfoCell(String label, String value, PdfFont font) {
        Paragraph p = new Paragraph()
                .setFont(font)
                .setFontSize(10)
                .add(new Text(label + ": ").setBold())
                .add(new Text(value));
        return new Cell().add(p).setBorder(Border.NO_BORDER);
    }

    private void addDispatchInfo(Document document, PdfFont font, DispatchRequest request) {
        document.add(createSectionTitle("배차 정보", font));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1, 2}))
                .useAllAvailableWidth()
                .setMarginBottom(20);

        addTableRow(table, font, "작업일", request.getWorkDate().format(DATE_FORMATTER));
        addTableRow(table, font, "작업시간", request.getWorkTime().format(TIME_FORMATTER));
        addTableRow(table, font, "현장주소", request.getSiteAddress(), 3);
        if (request.getSiteDetail() != null) {
            addTableRow(table, font, "상세위치", request.getSiteDetail(), 3);
        }
        addTableRow(table, font, "담당자", request.getContactName() != null ? request.getContactName() : "-");
        addTableRow(table, font, "연락처", request.getContactPhone() != null ? request.getContactPhone() : "-");

        document.add(table);
    }

    private void addEquipmentInfo(Document document, PdfFont font, Equipment equipment, Driver driver) {
        document.add(createSectionTitle("장비 및 기사 정보", font));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1, 2}))
                .useAllAvailableWidth()
                .setMarginBottom(20);

        addTableRow(table, font, "기사명", driver.getUser().getName());
        addTableRow(table, font, "연락처", driver.getUser().getPhone());
        addTableRow(table, font, "장비종류", getEquipmentTypeName(equipment.getType()));
        addTableRow(table, font, "차량번호", equipment.getVehicleNumber());
        if (equipment.getModel() != null) {
            addTableRow(table, font, "모델명", equipment.getModel());
            addTableRow(table, font, "최대높이", equipment.getMaxHeight() != null ? equipment.getMaxHeight() + "m" : "-");
        }
        addTableRow(table, font, "사업자명", driver.getBusinessName() != null ? driver.getBusinessName() : "-");
        addTableRow(table, font, "사업자번호", driver.getBusinessRegistrationNumber() != null ? driver.getBusinessRegistrationNumber() : "-");

        document.add(table);
    }

    private void addWorkDetails(Document document, PdfFont font, DispatchRequest request, DispatchMatch match) {
        document.add(createSectionTitle("작업 내용", font));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 3}))
                .useAllAvailableWidth()
                .setMarginBottom(20);

        addTableRowFull(table, font, "작업내용", request.getWorkDescription() != null ? request.getWorkDescription() : "-");
        addTableRowFull(table, font, "예상시간", request.getEstimatedHours() != null ? request.getEstimatedHours() + "시간" : "-");

        if (match.getWorkStartedAt() != null && match.getCompletedAt() != null) {
            addTableRowFull(table, font, "작업시작", match.getWorkStartedAt().format(DATETIME_FORMATTER));
            addTableRowFull(table, font, "작업완료", match.getCompletedAt().format(DATETIME_FORMATTER));

            long minutes = java.time.Duration.between(match.getWorkStartedAt(), match.getCompletedAt()).toMinutes();
            addTableRowFull(table, font, "실제작업시간", String.format("%d시간 %d분", minutes / 60, minutes % 60));
        }

        if (match.getWorkNotes() != null && !match.getWorkNotes().isEmpty()) {
            addTableRowFull(table, font, "작업메모", match.getWorkNotes());
        }

        document.add(table);
    }

    private void addPriceInfo(Document document, PdfFont font, DispatchRequest request, DispatchMatch match) {
        document.add(createSectionTitle("요금 정보", font));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                .useAllAvailableWidth()
                .setMarginBottom(20);

        BigDecimal originalPrice = request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO;
        BigDecimal finalPrice = match.getFinalPrice() != null ? match.getFinalPrice() : originalPrice;

        addTableRow(table, font, "기본요금", formatPrice(originalPrice));
        addTableRow(table, font, "최종요금", formatPrice(finalPrice));

        document.add(table);

        // 최종 요금 강조
        Paragraph total = new Paragraph()
                .setFont(font)
                .setFontSize(14)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(new Text("총 결제금액: ").setBold())
                .add(new Text(formatPrice(finalPrice)).setBold().setFontColor(PRIMARY_COLOR))
                .setMarginBottom(20);
        document.add(total);
    }

    private void addSignatures(Document document, PdfFont font, DispatchMatch match) {
        document.add(createSectionTitle("서명", font));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .useAllAvailableWidth()
                .setMarginBottom(20);

        // 기사 서명
        Cell driverCell = new Cell()
                .add(new Paragraph("기사 서명").setFont(font).setBold().setTextAlignment(TextAlignment.CENTER))
                .setBorder(new SolidBorder(BORDER_COLOR, 1))
                .setPadding(10);

        if (match.getDriverSignature() != null && !match.getDriverSignature().isEmpty()) {
            try {
                byte[] imageBytes = Base64.getDecoder().decode(
                        match.getDriverSignature().replace("data:image/png;base64,", "")
                );
                Image signatureImg = new Image(ImageDataFactory.create(imageBytes))
                        .setMaxWidth(150)
                        .setMaxHeight(80)
                        .setHorizontalAlignment(HorizontalAlignment.CENTER);
                driverCell.add(signatureImg);
            } catch (Exception e) {
                driverCell.add(new Paragraph("[서명 이미지]").setFont(font).setTextAlignment(TextAlignment.CENTER));
            }
        }
        driverCell.add(new Paragraph(match.getDriver().getUser().getName())
                .setFont(font)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(5));
        table.addCell(driverCell);

        // 고객 서명
        Cell clientCell = new Cell()
                .add(new Paragraph("고객 서명").setFont(font).setBold().setTextAlignment(TextAlignment.CENTER))
                .setBorder(new SolidBorder(BORDER_COLOR, 1))
                .setPadding(10);

        if (match.getClientSignature() != null && !match.getClientSignature().isEmpty()) {
            try {
                byte[] imageBytes = Base64.getDecoder().decode(
                        match.getClientSignature().replace("data:image/png;base64,", "")
                );
                Image signatureImg = new Image(ImageDataFactory.create(imageBytes))
                        .setMaxWidth(150)
                        .setMaxHeight(80)
                        .setHorizontalAlignment(HorizontalAlignment.CENTER);
                clientCell.add(signatureImg);
            } catch (Exception e) {
                clientCell.add(new Paragraph("[서명 이미지]").setFont(font).setTextAlignment(TextAlignment.CENTER));
            }
        }
        String clientName = match.getClientName() != null ? match.getClientName() : "고객";
        clientCell.add(new Paragraph(clientName)
                .setFont(font)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(5));
        table.addCell(clientCell);

        document.add(table);
    }

    private void addFooter(Document document, PdfFont font) {
        document.add(new Paragraph("\n"));

        Paragraph notice = new Paragraph()
                .setFont(font)
                .setFontSize(9)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .add("본 작업확인서는 전자서명법에 의거하여 법적 효력을 가집니다.\n")
                .add("문의사항이 있으시면 고객센터로 연락해 주시기 바랍니다.");
        document.add(notice);

        Paragraph generated = new Paragraph()
                .setFont(font)
                .setFontSize(8)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20)
                .add("Generated by Dispatch System © 2026");
        document.add(generated);
    }

    private Paragraph createSectionTitle(String title, PdfFont font) {
        return new Paragraph(title)
                .setFont(font)
                .setFontSize(14)
                .setBold()
                .setFontColor(PRIMARY_COLOR)
                .setBorderBottom(new SolidBorder(PRIMARY_COLOR, 2))
                .setPaddingBottom(5)
                .setMarginBottom(10)
                .setMarginTop(15);
    }

    private void addTableRow(Table table, PdfFont font, String label, String value) {
        addTableRow(table, font, label, value, 1);
    }

    private void addTableRow(Table table, PdfFont font, String label, String value, int colspan) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setFont(font).setFontSize(10).setBold())
                .setBackgroundColor(HEADER_BG_COLOR)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
                .setPadding(8);
        table.addCell(labelCell);

        Cell valueCell = new Cell(1, colspan)
                .add(new Paragraph(value != null ? value : "-").setFont(font).setFontSize(10))
                .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
                .setPadding(8);
        table.addCell(valueCell);
    }

    private void addTableRowFull(Table table, PdfFont font, String label, String value) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setFont(font).setFontSize(10).setBold())
                .setBackgroundColor(HEADER_BG_COLOR)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
                .setPadding(8);
        table.addCell(labelCell);

        Cell valueCell = new Cell()
                .add(new Paragraph(value != null ? value : "-").setFont(font).setFontSize(10))
                .setBorder(new SolidBorder(BORDER_COLOR, 0.5f))
                .setPadding(8);
        table.addCell(valueCell);
    }

    private String getEquipmentTypeName(Equipment.EquipmentType type) {
        return type.getDisplayName();
    }

    private String formatPrice(BigDecimal price) {
        if (price == null) return "0원";
        return String.format("%,d원", price.longValue());
    }
}
