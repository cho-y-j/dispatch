class User {
  final int id;
  final String email;
  final String name;
  final String phone;
  final UserRole role;
  final UserStatus status;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.phone,
    required this.role,
    required this.status,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      phone: json['phone'],
      role: UserRole.values.firstWhere(
        (e) => e.name == json['role'],
        orElse: () => UserRole.DRIVER,
      ),
      status: UserStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => UserStatus.PENDING,
      ),
    );
  }

  bool get isApproved => status == UserStatus.APPROVED;
  bool get isPending => status == UserStatus.PENDING;
  bool get isDriver => role == UserRole.DRIVER;
  bool get isCompany => role == UserRole.COMPANY;
  bool get isAdmin => role == UserRole.ADMIN;
}

enum UserRole { DRIVER, COMPANY, STAFF, ADMIN }
enum UserStatus { PENDING, APPROVED, REJECTED, SUSPENDED }
