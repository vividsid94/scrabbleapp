import React from 'react';
import { Modal, Box, Typography } from '@mui/material';

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
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
          borderRadius: 3,
          overflow: 'hidden',
          border: '4px solid #F59E0B',
          boxShadow: '0 0 0 6px rgba(245, 158, 11, 0.35), 0 24px 80px rgba(0, 0, 0, 0.65)',
          bgcolor: '#111827',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 3,
            py: 2,
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 55%, #92400E 100%)',
            borderBottom: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <img
            src="/images/topemascot.png"
            alt="Tope"
            style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              id="tope-thinking-modal-title"
              sx={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '0.02em' }}
            >
              Tope&apos;s Thinking
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', mt: 0.25 }}>
              {isLoading ? 'Reasoning about this move…' : 'Full LLM prompt and response for this move'}
            </Typography>
          </Box>
          <Box
            component="button"
            onClick={onClose}
            sx={{
              border: '2px solid rgba(255,255,255,0.6)',
              borderRadius: 2,
              px: 2,
              py: 1,
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              bgcolor: 'rgba(0,0,0,0.25)',
              cursor: 'pointer',
              flexShrink: 0,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' },
            }}
          >
            Close
          </Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#FBBF24', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Prompt sent to LLM
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#0B1220',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                color: '#E5E7EB',
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
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#34D399', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              LLM response
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#0B1220',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                color: '#E5E7EB',
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
