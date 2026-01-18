class WorkReport {
  final int dispatchId;
  final int matchId;
  // 배차 정보
  final String siteAddress;
  final String? siteDetail;
  final DateTime workDate;
  final String? workTime;
  final String? equipmentTypeName;
  final String? workDescription;
  // 발주처 정보
  final int? companyId;
  final String? companyName;
  final String staffName;
  final String staffPhone;
  // 기사 정보
  final int driverId;
  final String driverName;
  final String driverPhone;
  // 요금
  final double? originalPrice;
  final double? finalPrice;
  // 작업 시간
  final DateTime? matchedAt;
  final DateTime? departedAt;
  final DateTime? arrivedAt;
  final DateTime? workStartedAt;
  final DateTime? completedAt;
  // 서명 - 기사
  final String? driverSignature;
  final DateTime? driverSignedAt;
  // 서명 - 현장 담당자
  final String? clientSignature;
  final String? clientName;
  final DateTime? clientSignedAt;
  // 서명 - 발주처 확인
  final String? companySignature;
  final String? companySignedBy;
  final DateTime? companySignedAt;
  final bool? companyConfirmed;
  // 작업 메모 및 확인서
  final String? workNotes;
  final String? workReportUrl;
  final String? workPhotos;
  // 상태
  final String status;
  final String dispatchStatus;

  WorkReport({
    required this.dispatchId,
    required this.matchId,
    required this.siteAddress,
    this.siteDetail,
    required this.workDate,
    this.workTime,
    this.equipmentTypeName,
    this.workDescription,
    this.companyId,
    this.companyName,
    required this.staffName,
    required this.staffPhone,
    required this.driverId,
    required this.driverName,
    required this.driverPhone,
    this.originalPrice,
    this.finalPrice,
    this.matchedAt,
    this.departedAt,
    this.arrivedAt,
    this.workStartedAt,
    this.completedAt,
    this.driverSignature,
    this.driverSignedAt,
    this.clientSignature,
    this.clientName,
    this.clientSignedAt,
    this.companySignature,
    this.companySignedBy,
    this.companySignedAt,
    this.companyConfirmed,
    this.workNotes,
    this.workReportUrl,
    this.workPhotos,
    required this.status,
    required this.dispatchStatus,
  });

  factory WorkReport.fromJson(Map<String, dynamic> json) {
    return WorkReport(
      dispatchId: json['dispatchId'],
      matchId: json['matchId'],
      siteAddress: json['siteAddress'],
      siteDetail: json['siteDetail'],
      workDate: DateTime.parse(json['workDate']),
      workTime: json['workTime'],
      equipmentTypeName: json['equipmentTypeName'],
      workDescription: json['workDescription'],
      companyId: json['companyId'],
      companyName: json['companyName'],
      staffName: json['staffName'],
      staffPhone: json['staffPhone'],
      driverId: json['driverId'],
      driverName: json['driverName'],
      driverPhone: json['driverPhone'],
      originalPrice: json['originalPrice']?.toDouble(),
      finalPrice: json['finalPrice']?.toDouble(),
      matchedAt: json['matchedAt'] != null ? DateTime.parse(json['matchedAt']) : null,
      departedAt: json['departedAt'] != null ? DateTime.parse(json['departedAt']) : null,
      arrivedAt: json['arrivedAt'] != null ? DateTime.parse(json['arrivedAt']) : null,
      workStartedAt: json['workStartedAt'] != null ? DateTime.parse(json['workStartedAt']) : null,
      completedAt: json['completedAt'] != null ? DateTime.parse(json['completedAt']) : null,
      driverSignature: json['driverSignature'],
      driverSignedAt: json['driverSignedAt'] != null ? DateTime.parse(json['driverSignedAt']) : null,
      clientSignature: json['clientSignature'],
      clientName: json['clientName'],
      clientSignedAt: json['clientSignedAt'] != null ? DateTime.parse(json['clientSignedAt']) : null,
      companySignature: json['companySignature'],
      companySignedBy: json['companySignedBy'],
      companySignedAt: json['companySignedAt'] != null ? DateTime.parse(json['companySignedAt']) : null,
      companyConfirmed: json['companyConfirmed'],
      workNotes: json['workNotes'],
      workReportUrl: json['workReportUrl'],
      workPhotos: json['workPhotos'],
      status: json['status'],
      dispatchStatus: json['dispatchStatus'],
    );
  }

  bool get isSignedByDriver => driverSignature != null;
  bool get isSignedByClient => clientSignature != null;
  bool get isConfirmedByCompany => companyConfirmed == true;

  double get displayPrice => finalPrice ?? originalPrice ?? 0;
}
