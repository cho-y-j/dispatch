class Dispatch {
  final int id;
  final StaffInfo staff;
  final String siteAddress;
  final String? siteDetail;
  final double? latitude;
  final double? longitude;
  final String? contactName;
  final String? contactPhone;
  final DateTime workDate;
  final String workTime;
  final int? estimatedHours;
  final String? workDescription;
  final EquipmentType equipmentType;
  final String equipmentTypeName;
  final double? minHeight;
  final String? equipmentRequirements;
  final double? price;
  final bool? priceNegotiable;
  final DispatchStatus status;
  final MatchInfo? match;
  final DateTime createdAt;

  Dispatch({
    required this.id,
    required this.staff,
    required this.siteAddress,
    this.siteDetail,
    this.latitude,
    this.longitude,
    this.contactName,
    this.contactPhone,
    required this.workDate,
    required this.workTime,
    this.estimatedHours,
    this.workDescription,
    required this.equipmentType,
    required this.equipmentTypeName,
    this.minHeight,
    this.equipmentRequirements,
    this.price,
    this.priceNegotiable,
    required this.status,
    this.match,
    required this.createdAt,
  });

  factory Dispatch.fromJson(Map<String, dynamic> json) {
    return Dispatch(
      id: json['id'],
      staff: StaffInfo.fromJson(json['staff']),
      siteAddress: json['siteAddress'],
      siteDetail: json['siteDetail'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      contactName: json['contactName'],
      contactPhone: json['contactPhone'],
      workDate: DateTime.parse(json['workDate']),
      workTime: json['workTime'],
      estimatedHours: json['estimatedHours'],
      workDescription: json['workDescription'],
      equipmentType: EquipmentType.values.firstWhere(
        (e) => e.name == json['equipmentType'],
        orElse: () => EquipmentType.OTHER,
      ),
      equipmentTypeName: json['equipmentTypeName'] ?? '',
      minHeight: json['minHeight']?.toDouble(),
      equipmentRequirements: json['equipmentRequirements'],
      price: json['price']?.toDouble(),
      priceNegotiable: json['priceNegotiable'],
      status: DispatchStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => DispatchStatus.OPEN,
      ),
      match: json['match'] != null ? MatchInfo.fromJson(json['match']) : null,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  String get statusText {
    switch (status) {
      case DispatchStatus.OPEN:
        return '배차 대기';
      case DispatchStatus.MATCHED:
        return '매칭 완료';
      case DispatchStatus.IN_PROGRESS:
        return '작업 중';
      case DispatchStatus.COMPLETED:
        return '완료';
      case DispatchStatus.CANCELLED:
        return '취소됨';
    }
  }

  String get matchStatusText {
    if (match == null) return '';
    switch (match!.status) {
      case MatchStatus.ACCEPTED:
        return '수락됨';
      case MatchStatus.EN_ROUTE:
        return '이동 중';
      case MatchStatus.ARRIVED:
        return '현장 도착';
      case MatchStatus.WORKING:
        return '작업 중';
      case MatchStatus.COMPLETED:
        return '작업 완료';
      case MatchStatus.SIGNED:
        return '서명 완료';
      case MatchStatus.CANCELLED:
        return '취소됨';
    }
  }
}

class StaffInfo {
  final int id;
  final String name;
  final String phone;

  StaffInfo({required this.id, required this.name, required this.phone});

  factory StaffInfo.fromJson(Map<String, dynamic> json) {
    return StaffInfo(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
    );
  }
}

class MatchInfo {
  final int id;
  final int driverId;
  final String driverName;
  final String driverPhone;
  final MatchStatus status;
  final DateTime? matchedAt;
  final DateTime? arrivedAt;
  final DateTime? completedAt;
  final double? finalPrice;
  final String? workReportUrl;

  MatchInfo({
    required this.id,
    required this.driverId,
    required this.driverName,
    required this.driverPhone,
    required this.status,
    this.matchedAt,
    this.arrivedAt,
    this.completedAt,
    this.finalPrice,
    this.workReportUrl,
  });

  factory MatchInfo.fromJson(Map<String, dynamic> json) {
    return MatchInfo(
      id: json['id'],
      driverId: json['driverId'],
      driverName: json['driverName'],
      driverPhone: json['driverPhone'],
      status: MatchStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => MatchStatus.ACCEPTED,
      ),
      matchedAt: json['matchedAt'] != null ? DateTime.parse(json['matchedAt']) : null,
      arrivedAt: json['arrivedAt'] != null ? DateTime.parse(json['arrivedAt']) : null,
      completedAt: json['completedAt'] != null ? DateTime.parse(json['completedAt']) : null,
      finalPrice: json['finalPrice']?.toDouble(),
      workReportUrl: json['workReportUrl'],
    );
  }
}

enum EquipmentType {
  HIGH_LIFT_TRUCK,
  AERIAL_PLATFORM,
  SCISSOR_LIFT,
  BOOM_LIFT,
  LADDER_TRUCK,
  CRANE,
  FORKLIFT,
  OTHER,
}

enum DispatchStatus { OPEN, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED }
enum MatchStatus { ACCEPTED, EN_ROUTE, ARRIVED, WORKING, COMPLETED, SIGNED, CANCELLED }
