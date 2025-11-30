import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static final DateFormat _dateFormat = DateFormat('dd MMM yyyy');
  static final DateFormat _timeFormat = DateFormat('HH:mm');

  static String formatDate(DateTime date) => _dateFormat.format(date.toLocal());
  static String formatTime(String time) {
    try {
      final parts = time.split(':');
      if (parts.length >= 2) {
        final date = DateTime(0, 1, 1, int.parse(parts[0]), int.parse(parts[1]));
        return DateFormat('hh:mm a').format(date);
      }
      return time;
    } catch (_) {
      return time;
    }
  }
}
