"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string | null;
  name?: string;
};

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  error,
  name,
}: Props) {
  const id = React.useId();
  const [visible, setVisible] = React.useState(false);
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-base-content/70">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`input input-bordered w-full bg-base-100 pr-11 ${
            error ? "input-error" : ""
          }`}
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square absolute right-1 top-1/2 -translate-y-1/2"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? (
        <p id={describedBy} className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

