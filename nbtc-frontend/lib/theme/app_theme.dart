import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData light() {
    final base = ThemeData.light(useMaterial3: true);
    const primaryBlue = Color(0xFF0D47A1);
    const cardRed = Color(0xFFB71C1C);
    return base.copyWith(
      colorScheme: base.colorScheme.copyWith(
        primary: primaryBlue,
        secondary: const Color(0xFF1976D2),
      ),
      scaffoldBackgroundColor: Colors.white,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        titleTextStyle: base.textTheme.titleLarge?.copyWith(
          color: primaryBlue,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: const IconThemeData(color: primaryBlue),
      ),
      textTheme: base.textTheme.apply(
        bodyColor: primaryBlue,
        displayColor: primaryBlue,
      ),
      cardTheme: base.cardTheme.copyWith(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: cardRed,
      ),
      cardColor: cardRed,
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: Colors.white),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: cardRed,
          foregroundColor: Colors.white,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primaryBlue,
        unselectedItemColor: primaryBlue.withOpacity(0.7),
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
      ),
      inputDecorationTheme: base.inputDecorationTheme.copyWith(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        filled: true,
        fillColor: Colors.white,
      ),
    );
  }
}
