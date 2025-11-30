class AdminUser {
  const AdminUser({
    required this.id,
    required this.username,
    required this.fullName,
    required this.roles,
    required this.roleIds,
    this.branchName,
    this.branchId,
    this.isActive = true,
    this.email,
    this.phoneNumber,
  });

  final String id;
  final String username;
  final String fullName;
  final List<String> roles;
  final List<String> roleIds;
  final String? branchName;
  final String? branchId;
  final bool isActive;
  final String? email;
  final String? phoneNumber;

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    final rawRoles = (json['roleId'] as List<dynamic>? ?? []);
    final roles = rawRoles
        .map((role) {
          if (role is Map<String, dynamic>) {
            return role['name']?.toString();
          }
          return role?.toString();
        })
        .whereType<String>()
        .toList();
    final roleIds = rawRoles
        .map((role) {
          if (role is Map<String, dynamic>) {
            return role['_id']?.toString();
          }
          return role?.toString();
        })
        .whereType<String>()
        .toList();
    return AdminUser(
      id: json['_id']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      roles: roles,
      roleIds: roleIds,
      branchName: json['branchId'] is Map<String, dynamic>
          ? json['branchId']['name']?.toString()
          : null,
      branchId: json['branchId'] is Map<String, dynamic>
          ? json['branchId']['_id']?.toString()
          : json['branchId']?.toString(),
      isActive: json['isActive'] != false,
      email: json['userInfoId'] is Map<String, dynamic>
          ? json['userInfoId']['email']?.toString()
          : null,
      phoneNumber: json['userInfoId'] is Map<String, dynamic>
          ? json['userInfoId']['phoneNumber']?.toString()
          : null,
    );
  }
}
