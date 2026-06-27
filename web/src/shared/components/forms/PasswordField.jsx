"use client";

import { useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

/**
 * Plain (non-RHF) MUI password field with a show/hide eye toggle.
 * Forwards every TextField prop (value, onChange, error, helperText, …).
 * For RHF-bound forms use RHFTextField instead — it has the same toggle built in.
 */
export default function PasswordField({ slotProps, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <TextField
      {...props}
      type={show ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={show ? "hide password" : "show password"}
                onClick={() => setShow((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
              >
                {show ? <MdVisibilityOff /> : <MdVisibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
