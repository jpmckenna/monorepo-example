package com.example.common;

import java.util.Objects;

public record Product(Sku sku, Money price, int inventoryCount) {
    public Product {
        Objects.requireNonNull(sku, "sku");
        Objects.requireNonNull(price, "price");
        if (inventoryCount < 0) {
            throw new IllegalArgumentException("inventoryCount cannot be negative");
        }
    }
}
