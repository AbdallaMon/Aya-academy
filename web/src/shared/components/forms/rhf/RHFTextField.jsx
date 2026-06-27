"use client";

import { useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { Controller } from "react-hook-form";

// RHF-bound MUI TextField. Pass `control` from useForm and a `name`.
// When `type="password"`, a show/hide eye icon is added automatically.
export default function RHFTextField({ name, control, label, rules, type, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          label={label}
          type={resolvedType}
          fullWidth
          required={!!rules?.required}
          error={!!fieldState.error}
          {...props}
          helperText={props.helperText || fieldState.error?.message}
          slotProps={
            isPassword
              ? {
                  ...props.slotProps,
                  input: {
                    ...props.slotProps?.input,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? "hide password" : "show password"}
                          onClick={() => setShowPassword((v) => !v)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }
              : props.slotProps
          }
        />
      )}
    />
  );
}
