import React, { forwardRef, useState } from 'react';
import { Input } from './input';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

interface FormattedNumberInputProps extends Omit<React.ComponentProps<"input">, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => {
      if (value && parseFloat(value) > 0) {
        return formatNumberInput(value);
      }
      return value || '';
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Format the display value
      const formatted = formatNumberInput(inputValue);
      setDisplayValue(formatted);
      
      // Call onChange with the clean numeric value
      if (onChange) {
        const cleanValue = parseFormattedNumber(formatted);
        onChange(cleanValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ensure proper formatting on blur
      if (displayValue) {
        const cleanValue = parseFormattedNumber(displayValue);
        const numValue = parseFloat(cleanValue);
        if (!isNaN(numValue) && numValue > 0) {
          const formatted = formatNumberInput(numValue.toString());
          setDisplayValue(formatted);
        }
      }
      
      // Call original onBlur if provided
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    // Update display value when value prop changes
    React.useEffect(() => {
      if (value !== undefined) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
          setDisplayValue(formatNumberInput(value));
        } else {
          setDisplayValue(value || '');
        }
      }
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }
);

FormattedNumberInput.displayName = 'FormattedNumberInput';

export { FormattedNumberInput };