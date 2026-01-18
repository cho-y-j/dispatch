enum SenderType { DRIVER, COMPANY }

class ChatMessage {
  final int id;
  final int dispatchId;
  final int senderId;
  final String? senderName;
  final SenderType senderType;
  final String message;
  final String? imageUrl;
  final bool isRead;
  final String? readAt;
  final String createdAt;

  ChatMessage({
    required this.id,
    required this.dispatchId,
    required this.senderId,
    this.senderName,
    required this.senderType,
    required this.message,
    this.imageUrl,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      dispatchId: json['dispatchId'],
      senderId: json['senderId'],
      senderName: json['senderName'],
      senderType: SenderType.values.firstWhere(
        (e) => e.name == json['senderType'],
        orElse: () => SenderType.DRIVER,
      ),
      message: json['message'] ?? '',
      imageUrl: json['imageUrl'],
      isRead: json['isRead'] ?? false,
      readAt: json['readAt'],
      createdAt: json['createdAt'],
    );
  }
}
