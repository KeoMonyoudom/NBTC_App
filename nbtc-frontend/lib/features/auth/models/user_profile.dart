class UserProfile {
  const UserProfile({
    required this.username,
    required this.fullName,
    required this.roles,
    this.branchName,
    this.branchId,
  });

  final String username;
  final String fullName;
  final List<String> roles;
  final String? branchName;
  final String? branchId;

  factory UserProfile.fromLoginPayload(Map<String, dynamic> json) {
    final user = (json['user'] ?? <String, dynamic>{}) as Map<String, dynamic>;
    return UserProfile(
      username: user['username']?.toString() ?? '',
      fullName: user['fullName']?.toString() ?? '',
      roles: _parseRoleNames(user['roleId']),
      branchId: user['branchId']?.toString(),
      branchName: user['branchId'] is Map<String, dynamic>
          ? (user['branchId']['name']?.toString())
          : null,
    );
  }

  factory UserProfile.fromProfileJson(Map<String, dynamic> json) {
    return UserProfile(
      username: json['username']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      roles: _parseRoleNames(json['roleId']),
      branchId: json['branchId'] is Map<String, dynamic>
          ? json['branchId']['_id']?.toString()
          : json['branchId']?.toString(),
      branchName: json['branchId'] is Map<String, dynamic>
          ? json['branchId']['name']?.toString()
          : null,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'username': username,
        'fullName': fullName,
        'roles': roles,
        'branchId': branchId,
        'branchName': branchName,
      };

  static List<String> _parseRoleNames(dynamic roleField) {
    if (roleField is List) {
      return roleField
          .map((role) {
            if (role is Map<String, dynamic>) {
              return role['name']?.toString();
            }
            return role?.toString();
          })
          .whereType<String>()
          .toList();
    }
    if (roleField is Map<String, dynamic>) {
      return [roleField['name']?.toString()].whereType<String>().toList();
    }
    return const [];
  }
}
