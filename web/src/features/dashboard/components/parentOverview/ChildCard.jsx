'use client';

import Link from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MdArrowForward } from 'react-icons/md';
import { localePath } from '@/i18n/routing.js';
import SubscriptionStatusChip from '@/shared/components/SubscriptionStatusChip.jsx';
import UsageMeterCard from '@/features/subscriptionDetail/components/UsageMeterCard.jsx';
import ChildMetric from './ChildMetric.jsx';

// Per-child summary card. Branches on the backend-computed subscriptionState so
// a pending renewal reads as "awaiting payment", not "expired". Only ACTIVE
// shows the stats/achievements; every other state hides them and surfaces a
// state-appropriate note + CTA.
export default function ChildCard({ child, txt, lng }) {
  // Multi-sub: the current ACTIVE plan and the open (accumulating) USAGE bill are
  // shown side by side instead of a single scalar. Falls back gracefully when a
  // legacy payload has no subscriptions[].
  const current = child.subscriptions?.find((s) => s.status === 'ACTIVE') ?? null;
  const open =
    child.subscriptions?.find(
      (s) => s.origin === 'USAGE' && s.status === 'UPCOMING',
    ) ?? null;
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow .25s ease, transform .25s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
        '&::before': {
          content: '""',
          position: 'absolute',
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: (t) =>
            `linear-gradient(180deg, ${t.palette.primary.main}, ${t.palette.success.main})`,
        },
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ mb: 1.5 }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 46,
              height: 46,
              fontWeight: 800,
            }}
          >
            {String(child.nickname || child.name || '?')
              .charAt(0)
              .toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} noWrap>
              {child.nickname || child.name}
            </Typography>
            {current ? (
              <SubscriptionStatusChip sub={current} txt={txt} />
            ) : (
              <Chip
                size="small"
                color="default"
                label={txt.noActiveSubscription}
                sx={{ height: 22, fontSize: 11, fontWeight: 700 }}
              />
            )}
          </Box>
        </Stack>

        {/* Branch on the backend-computed subscriptionState so a pending
            renewal reads as "awaiting payment", not "expired". Only ACTIVE
            shows the stats/achievements; every other state hides them and
            surfaces a state-appropriate note + CTA. */}
        {(() => {
          const state = child.subscriptionState;
          if (state === 'ACTIVE') {
            return (
              <>
                <Stack
                  direction="row"
                  divider={
                    <Box sx={{ width: '1px', bgcolor: 'divider' }} />
                  }
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
                  }}
                >
                  <ChildMetric
                    value={child.points ?? 0}
                    label={txt.points2}
                    color="primary.main"
                  />
                  <ChildMetric
                    value={child.level ?? 1}
                    label={txt.level}
                    color="secondary.main"
                  />
                  <ChildMetric
                    value={`#${child.rank ?? '-'}`}
                    label={txt.rank}
                    color="text.primary"
                  />
                  <ChildMetric
                    value={child.badgeCount ?? 0}
                    label={txt.badgesLabel}
                    color="warning.main"
                  />
                </Stack>

                {child.activeSubscription?.remainingHours != null && (
                  <Typography
                    variant="caption"
                    color="success.main"
                    fontWeight={700}
                    sx={{ display: 'block', mt: 1.5 }}
                  >
                    ⏳ {child.activeSubscription.remainingHours}{' '}
                    {txt.remainingHours}
                  </Typography>
                )}
              </>
            );
          }

          if (state === 'PENDING') {
            return (
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
                sx={{
                  py: 1.5,
                  px: 1.5,
                  borderRadius: 2,
                  bgcolor: (t) => alpha(t.palette.info.main, 0.08),
                }}
              >
                <Box aria-hidden sx={{ fontSize: 22 }}>
                  ⏳
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  {txt.pendingChildNote}
                </Typography>
              </Stack>
            );
          }

          if (state === 'NONE') {
            return (
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
                sx={{
                  py: 1.5,
                  px: 1.5,
                  borderRadius: 2,
                  bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                }}
              >
                <Box aria-hidden sx={{ fontSize: 22 }}>
                  📋
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  {txt.noSubscriptionNote}
                </Typography>
              </Stack>
            );
          }

          // EXPIRED (and any unknown/legacy state) → actionable renew note.
          return (
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{
                py: 1.5,
                px: 1.5,
                borderRadius: 2,
                bgcolor: (t) => alpha(t.palette.warning.main, 0.08),
              }}
            >
              <Box aria-hidden sx={{ fontSize: 22 }}>
                🔒
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
              >
                {txt.inactiveChildNote}
              </Typography>
            </Stack>
          );
        })()}

        {/* The open, live-accumulating next-month USAGE bill (if any). */}
        {open && (
          <Box sx={{ mt: 1.5 }}>
            <UsageMeterCard subscriptionId={open.id} txt={txt} />
          </Box>
        )}

        {(() => {
          const state = child.subscriptionState;
          const subHref =
            child.latestSubscriptionId != null
              ? localePath(
                  lng,
                  `/dashboard/subscriptions/${child.latestSubscriptionId}`
                )
              : null;

          // PENDING: view the in-flight subscription — no renew, no "expired".
          if (state === 'PENDING') {
            return (
              <Button
                fullWidth
                size="small"
                variant="outlined"
                component={Link}
                href={
                  subHref || localePath(lng, '/dashboard/subscriptions')
                }
                endIcon={
                  <Box
                    sx={{
                      display: 'flex',
                      transform: lng === 'en' ? 'none' : 'scaleX(-1)',
                    }}
                  >
                    <MdArrowForward />
                  </Box>
                }
                sx={{ mt: 1.5, fontWeight: 700 }}
              >
                {txt.viewSubscription}
              </Button>
            );
          }

          // EXPIRED: renew. Prefer the latest subscription's detail page
          // (where the Renew dialog lives); fall back to children area.
          if (state === 'EXPIRED') {
            return (
              <Button
                fullWidth
                size="small"
                variant="contained"
                component={Link}
                href={subHref || localePath(lng, '/dashboard/children')}
                endIcon={
                  <Box
                    sx={{
                      display: 'flex',
                      transform: lng === 'en' ? 'none' : 'scaleX(-1)',
                    }}
                  >
                    <MdArrowForward />
                  </Box>
                }
                sx={{ mt: 1.5, fontWeight: 700 }}
              >
                {txt.renewSubscription}
              </Button>
            );
          }

          // NONE: choose a plan (reuse the page's existing subscriptions nav).
          if (state === 'NONE') {
            return (
              <Button
                fullWidth
                size="small"
                variant="contained"
                component={Link}
                href={localePath(lng, '/dashboard/subscriptions')}
                endIcon={
                  <Box
                    sx={{
                      display: 'flex',
                      transform: lng === 'en' ? 'none' : 'scaleX(-1)',
                    }}
                  >
                    <MdArrowForward />
                  </Box>
                }
                sx={{ mt: 1.5, fontWeight: 700 }}
              >
                {txt.choosePlan}
              </Button>
            );
          }

          // ACTIVE (and fallback): view child details.
          return (
            <Button
              fullWidth
              size="small"
              variant="text"
              component={Link}
              href={localePath(lng, '/dashboard/children')}
              endIcon={
                <Box
                  sx={{
                    display: 'flex',
                    transform: lng === 'en' ? 'none' : 'scaleX(-1)',
                  }}
                >
                  <MdArrowForward />
                </Box>
              }
              sx={{ mt: 1.5, fontWeight: 700 }}
            >
              {txt.viewDetails}
            </Button>
          );
        })()}

        {child.subscriptions?.length > 0 && (
          <Button
            fullWidth
            size="small"
            variant="text"
            component={Link}
            href={localePath(
              lng,
              `/dashboard/subscriptions?studentId=${child.id}`,
            )}
            sx={{ mt: 1 }}
          >
            {txt.viewAll}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
