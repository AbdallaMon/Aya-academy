"use client";

import { Avatar, Box, Card, CardContent, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MdMilitaryTech } from "react-icons/md";
import { iconColor } from "@/shared/ui/iconColor.js";
import { localizedField } from "../../../notifications/config/notificationsText.js";
import { isEmojiIcon } from "./helpers.js";

// "My badges" achievement card. Inactive students see a gentle lock note (no
// billing nag); otherwise the earned badges (or an empty note).
export default function BadgesCard({ txt, lng, theme, badges, subActive, lock }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
          <MdMilitaryTech color={iconColor(theme, "secondary")} size={22} />
          <Typography variant="subtitle1" fontWeight={800}>
            {txt.myBadges}
          </Typography>
        </Stack>
        {!subActive ? (
          <Stack direction="row" alignItems="center" gap={1} sx={{ py: 1 }}>
            <Box aria-hidden sx={{ fontSize: 22 }}>🔒</Box>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {lock.studentTitle}
            </Typography>
          </Stack>
        ) : badges.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            {txt.noBadgesYet}
          </Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {badges.map((b, i) => {
              const tone = ["secondary", "primary", "warning", "success"][i % 4];
              return (
                <Tooltip key={b.id} title={localizedField(b, "name", lng)}>
                  <Stack alignItems="center" sx={{ width: 76 }}>
                    <Avatar
                      sx={{
                        bgcolor: (t) => alpha(t.palette[tone].main, 0.18),
                        color: `${tone}.main`,
                        width: 56,
                        height: 56,
                        fontSize: 28,
                      }}
                    >
                      {isEmojiIcon(b.icon) ? b.icon : <MdMilitaryTech size={28} />}
                    </Avatar>
                    <Typography
                      variant="caption"
                      align="center"
                      noWrap
                      sx={{ width: "100%", mt: 0.5, fontWeight: 700 }}
                    >
                      {localizedField(b, "name", lng)}
                    </Typography>
                  </Stack>
                </Tooltip>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
