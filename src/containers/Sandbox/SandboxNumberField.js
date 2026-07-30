import React, { useEffect, useState } from 'react';
import { TextField } from '@mui/material';

// A numeric TextField that only parses/clamps on blur, not on every
// keystroke. A plain controlled `value={n}` + `onChange={... || fallback}`
// input snaps back to the fallback the instant the field goes empty (NaN is
// falsy, so `NaN || 1` becomes 1 immediately) - so clearing "500" to retype
// "90" actually left "1" sitting in the field, and the first new digit
// landed next to that leftover "1" instead of into an empty box. Keeping
// the in-progress text as local draft state until blur lets the field go
// genuinely empty while the user is mid-edit.
export default function SandboxNumberField({
  value, onCommit, parse = (s) => parseFloat(s), min, max,
  size = 'small', placeholder, disabled, sx, inputProps
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    let parsed = parse(draft);
    if (!Number.isFinite(parsed)) parsed = value;
    if (min !== undefined) parsed = Math.max(min, parsed);
    if (max !== undefined) parsed = Math.min(max, parsed);
    onCommit(parsed);
    setDraft(String(parsed));
  };

  return (
    <TextField
      size={size}
      type="number"
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      sx={sx}
      inputProps={{ min, max, ...inputProps }}
    />
  );
}
