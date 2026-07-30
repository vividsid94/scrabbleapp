import React from 'react';
import Box from '@mui/material/Box';
import { IconButton, MenuItem, Select, TextField } from '@mui/material';
import { Plus, Trash } from '@phosphor-icons/react';
import SandboxNumberField from './SandboxNumberField.js';

// Mirrors simulate.go's LeaveRule.Type values exactly - see that file's
// comment for what each does to the running leave value.
const RULE_TYPES = [
  { value: 'containsLetter', label: 'Contains letter' },
  { value: 'containsAny', label: 'Contains any of' },
  { value: 'containsAll', label: 'Contains all of' },
  { value: 'containsCount', label: 'Count of letter' },
  { value: 'vowelCount', label: 'Vowel count' },
  { value: 'consonantCount', label: 'Consonant count' },
  { value: 'hasBlank', label: 'Has a blank' },
  { value: 'lengthEquals', label: 'Leave length is' },
  { value: 'multiplier', label: 'Multiply leave value' },
];

const COMPARATORS = [
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'eq', label: '=' },
];

const needsLetter = (type) => type === 'containsLetter' || type === 'containsCount';
const needsLetters = (type) => type === 'containsAny' || type === 'containsAll';
const needsComparator = (type) => type === 'containsCount' || type === 'vowelCount' || type === 'consonantCount';
const needsCount = (type) => needsComparator(type) || type === 'lengthEquals';
const needsBonus = (type) => type !== 'multiplier';
const needsMultiplier = (type) => type === 'multiplier';

// One player's list of leave-value rules for the Sandbox series simulator -
// e.g. "any leave with an S is worth 20 more than the table says." Purely a
// controlled editor: all state/mutation lives in sandboxStore.js, this just
// renders the rows and reports edits up.
export default function SandboxLeaveRules({
  rules, onAdd, onUpdate, onRemove, disabled,
  textColor, mutedTextColor, borderColor, accentColor
}) {
  const fieldSx = {
    '& .MuiInputBase-input': { fontSize: '11px', color: textColor, padding: '4px 6px' },
    '& .MuiSelect-select': { fontSize: '11px', color: textColor, padding: '4px 20px 4px 6px' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor },
    // Placeholders (e.g. the example "S") must read as unmistakably NOT a
    // real value - full-strength textColor is reserved for what's actually
    // typed, so a placeholder can't be mistaken for an entered letter.
    '& .MuiInputBase-input::placeholder': { color: mutedTextColor, opacity: 0.6, fontStyle: 'italic' },
  };

  return (
    <Box sx={{ marginTop: '2px', marginBottom: '10px' }}>
      {rules.map((rule, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px',
            marginBottom: '4px', padding: '4px', borderRadius: '6px',
            border: `1px dashed ${borderColor}`,
          }}
        >
          <Select
            size="small"
            value={rule.type}
            disabled={disabled}
            onChange={(e) => onUpdate(index, { type: e.target.value })}
            sx={{ ...fieldSx, minWidth: '128px' }}
          >
            {RULE_TYPES.map(t => (
              <MenuItem key={t.value} value={t.value} sx={{ fontSize: '11px' }}>{t.label}</MenuItem>
            ))}
          </Select>

          {needsLetter(rule.type) && (
            <TextField
              size="small"
              placeholder="S"
              value={rule.letter || ''}
              disabled={disabled}
              onChange={(e) => onUpdate(index, { letter: e.target.value.slice(0, 1).toUpperCase() })}
              sx={{ ...fieldSx, width: '40px' }}
            />
          )}

          {needsLetters(rule.type) && (
            <TextField
              size="small"
              placeholder="AEIOU"
              value={rule.letters || ''}
              disabled={disabled}
              onChange={(e) => onUpdate(index, { letters: e.target.value.toUpperCase() })}
              sx={{ ...fieldSx, width: '76px' }}
            />
          )}

          {needsComparator(rule.type) && (
            <Select
              size="small"
              value={rule.comparator || 'gte'}
              disabled={disabled}
              onChange={(e) => onUpdate(index, { comparator: e.target.value })}
              sx={{ ...fieldSx, minWidth: '52px' }}
            >
              {COMPARATORS.map(c => (
                <MenuItem key={c.value} value={c.value} sx={{ fontSize: '11px' }}>{c.label}</MenuItem>
              ))}
            </Select>
          )}

          {needsCount(rule.type) && (
            <SandboxNumberField
              value={rule.count ?? 0}
              onCommit={(n) => onUpdate(index, { count: n })}
              parse={(s) => parseInt(s, 10)}
              disabled={disabled}
              sx={{ ...fieldSx, width: '48px' }}
            />
          )}

          {needsBonus(rule.type) && (
            <SandboxNumberField
              value={rule.bonus ?? 0}
              onCommit={(n) => onUpdate(index, { bonus: n })}
              parse={(s) => parseFloat(s)}
              placeholder="bonus"
              disabled={disabled}
              sx={{ ...fieldSx, width: '58px' }}
            />
          )}

          {needsMultiplier(rule.type) && (
            <SandboxNumberField
              value={rule.multiplier ?? 1}
              onCommit={(n) => onUpdate(index, { multiplier: n })}
              parse={(s) => parseFloat(s)}
              placeholder="x1"
              disabled={disabled}
              sx={{ ...fieldSx, width: '52px' }}
            />
          )}

          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => onRemove(index)}
            sx={{ color: mutedTextColor, padding: '2px', marginLeft: 'auto' }}
          >
            <Trash size={13} />
          </IconButton>
        </Box>
      ))}

      {rules.length > 0 && (
        <Box sx={{ fontSize: '10px', color: mutedTextColor, lineHeight: 1.4, marginBottom: '6px' }}>
          Bonus: a positive number adds to the leave's table value, a negative number subtracts from it. Multiplier scales the running total instead (2 doubles it, 0.5 halves it).
        </Box>
      )}

      <Box
        onClick={disabled ? undefined : onAdd}
        sx={{
          display: 'flex', alignItems: 'center', gap: '4px',
          cursor: disabled ? 'default' : 'pointer',
          fontSize: '11px', fontWeight: 600,
          color: disabled ? mutedTextColor : accentColor,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Plus size={12} weight="bold" />
        Add leave rule
      </Box>
    </Box>
  );
}
