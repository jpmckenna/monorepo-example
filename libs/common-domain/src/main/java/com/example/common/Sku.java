package com.example.common;

import java.util.Objects;
import java.util.regex.Pattern;

public record Sku(String value) {
  private static final Pattern VALID = Pattern.compile("[A-Z0-9-]{4,32}");

  public Sku {
    Objects.requireNonNull(value, "value");
    if (!VALID.matcher(value).matches()) {
      throw new IllegalArgumentException("invalid SKU: " + value);
    }
  }

  @Override
  public String toString() {
    return value;
  }
}
