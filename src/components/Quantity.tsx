// components/ui/quantity-input.tsx
"use client";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface QuantityInputProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function QuantityInput({
  value,
  min = 1,
  max = 99,
  onChange,
  className,
}: QuantityInputProps) {
  const [quantity, setQuantity] = useState(value);

  useEffect(() => {
    setQuantity(value);
  }, [value]);

  const handleIncrement = () => {
    const newValue = Math.min(quantity + 1, max);
    setQuantity(newValue);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(quantity - 1, min);
    setQuantity(newValue);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === "") {
      setQuantity(min);
      onChange(min);
      return;
    }

    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, min), max);
      setQuantity(clampedValue);
      onChange(clampedValue);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className="h-8 w-8"
      >
        <Minus className="h-3 w-3" />
      </Button>
      <Input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={handleInputChange}
        className="w-16 text-center h-8"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="h-8 w-8"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}