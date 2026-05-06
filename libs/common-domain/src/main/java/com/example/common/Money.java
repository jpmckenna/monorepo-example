package com.example.common;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.Objects;

public record Money(BigDecimal amount, Currency currency) {
  public Money {
    Objects.requireNonNull(amount, "amount");
    Objects.requireNonNull(currency, "currency");
    if (amount.scale() > currency.getDefaultFractionDigits()) {
      throw new IllegalArgumentException(
          "amount scale "
              + amount.scale()
              + " exceeds currency default fraction digits "
              + currency.getDefaultFractionDigits());
    }
  }

  public static Money usd(String amount) {
    return new Money(new BigDecimal(amount), Currency.getInstance("USD"));
  }

  public Money plus(Money other) {
    if (!currency.equals(other.currency)) {
      throw new IllegalArgumentException(
          "currency mismatch: " + currency + " vs " + other.currency);
    }
    return new Money(amount.add(other.amount), currency);
  }
}
