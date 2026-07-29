import React from 'react';
import { Modal, Box, Typography } from '@mui/material';

const SERIF = '"Palatino Linotype", Georgia, serif';

export default function TopeThinkingModal({ open, onClose, topeThinking }) {
  if (!topeThinking) return null;

  const isLoading = topeThinking.status === 'loading';

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="tope-thinking-modal-title"
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(10, 6, 4, 0.85)',
          backdropFilter: 'blur(6px)',
        },
      }}
      sx={{ zIndex: 10000 }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(960px, 94vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          border: '3px solid #92400E',
          boxShadow: '0 0 0 6px rgba(217, 119, 6, 0.25), 0 24px 80px rgba(0, 0, 0, 0.65)',
          background: 'linear-gradient(135deg, #5a1620 0%, #2a0a10 100%)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 3,
            py: 2,
            background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 55%, #92400E 100%)',
            borderBottom: '2px solid rgba(0,0,0,0.25)',
          }}
        >
          <img
            src="/images/compressed/topemascot-compressed.png"
            alt="Tope"
            style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              id="tope-thinking-modal-title"
              sx={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: '#1a0f05', lineHeight: 1.2, letterSpacing: '0.02em' }}
            >
              Tope&apos;s Thinking
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: 13, color: '#4a2c14', mt: 0.25 }}>
              {isLoading ? 'Reasoning about this move…' : 'Full LLM prompt and response for this move'}
            </Typography>
          </Box>
          <Box
            component="button"
            onClick={onClose}
            sx={{
              border: '2px solid rgba(26, 15, 5, 0.4)',
              borderRadius: 1.5,
              px: 2,
              py: 1,
              fontFamily: SERIF,
              fontSize: 14,
              fontWeight: 700,
              color: '#1a0f05',
              bgcolor: 'rgba(255,255,255,0.25)',
              cursor: 'pointer',
              flexShrink: 0,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
            }}
          >
            Close
          </Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography sx={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, color: '#FBBF24', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Prompt sent to LLM
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                color: 'rgba(255,255,255,0.88)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '38vh',
                overflowY: 'auto',
              }}
            >
              {topeThinking.prompt || '(none — Tope fell back to the default top move)'}
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, color: '#FBBF24', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              LLM response
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                color: 'rgba(255,255,255,0.88)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '28vh',
                overflowY: 'auto',
              }}
            >
              {topeThinking.response || '(no response recorded)'}
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
