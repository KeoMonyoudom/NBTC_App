class RoleModel {
  const RoleModel({required this.id, required this.name});

  final String id;
  final String name;

  factory RoleModel.fromJson(Map<String, dynamic> json) {
    return RoleModel(
      id: json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }
}
