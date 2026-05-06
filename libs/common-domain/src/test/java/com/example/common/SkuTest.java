package com.example.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class SkuTest {

  @Test
  void acceptsValidSku() {
    assertEquals("ABC-123", new Sku("ABC-123").value());
  }

  @Test
  void rejectsLowercase() {
    assertThrows(IllegalArgumentException.class, () -> new Sku("abc-123"));
  }

  @Test
  void rejectsTooShort() {
    assertThrows(IllegalArgumentException.class, () -> new Sku("AB"));
  }
}
