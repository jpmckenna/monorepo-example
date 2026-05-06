package com.example.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class MoneyTest {

  @Test
  void plusAddsAmounts() {
    var a = Money.usd("1.50");
    var b = Money.usd("2.25");
    assertEquals(Money.usd("3.75"), a.plus(b));
  }

  @Test
  void plusRejectsCurrencyMismatch() {
    var usd = Money.usd("1.00");
    var eur = new Money(new java.math.BigDecimal("1.00"), java.util.Currency.getInstance("EUR"));
    assertThrows(IllegalArgumentException.class, () -> usd.plus(eur));
  }

  @Test
  void rejectsOverScaledAmount() {
    assertThrows(IllegalArgumentException.class, () -> Money.usd("1.234"));
  }
}
