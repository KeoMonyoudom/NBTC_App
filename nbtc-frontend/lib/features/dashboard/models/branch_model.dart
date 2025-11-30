class BranchModel {
  const BranchModel({
    required this.name,
    this.address,
    this.city,
    this.phone,
    this.managerName,
    this.id,
  });

  final String name;
  final String? address;
  final String? city;
  final String? phone;
  final String? managerName;
  final String? id;

  factory BranchModel.fromJson(Map<String, dynamic> json) {
    return BranchModel(
      name: json['name']?.toString() ?? '',
      address: json['address']?.toString(),
      city: json['city']?.toString(),
      phone: json['phone']?.toString(),
      managerName: json['managerId'] is Map<String, dynamic>
          ? json['managerId']['fullName']?.toString()
          : null,
      id: json['_id']?.toString() ?? json['id']?.toString(),
    );
  }
}
