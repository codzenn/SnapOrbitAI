"use client";

import React from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
  error?: string | null;
  name?: string;
};

export function AuthField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  required,
  error,
  name,
}: Props) {
  const id = React.useId();
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-base-content/70">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`input input-bordered w-full bg-base-100 ${
          error ? "input-error" : ""
        }`}
      />
      {error ? (
        <p id={describedBy} className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

