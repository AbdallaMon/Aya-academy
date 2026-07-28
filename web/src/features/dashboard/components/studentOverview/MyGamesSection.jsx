"use client";

import Link from "next/link";
import { Avatar, Box, Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MdArrowForward, MdPlayArrow } from "react-icons/md";
import { localePath } from "@/i18n/routing.js";
import { localizedField } from "../../../notifications/config/notificationsText.js";
import SectionTitle from "./SectionTitle.jsx";
import { GAME_TONES, gameStatusLabel } from "./helpers.js";

// "My games" — big tap targets. Shows up to the first 6 assigned games.
export default function MyGamesSection({ txt, lng, games }) {
  return (
    <>
      <SectionTitle
        emoji="🕹️"
        title={txt.myGames}
        action={
          <Button
            size="small"
            component={Link}
            href={localePath(lng, "/dashboard/games")}
            endIcon={
              <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                <MdArrowForward />
              </Box>
            }
            sx={{ fontWeight: 800 }}
          >
            {txt.games}
          </Button>
        }
      />
      {games.length === 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {txt.noGamesYet}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          {games.slice(0, 6).map((g, i) => {
            const tone = GAME_TONES[i % GAME_TONES.length];
            const done = g.status === "COMPLETED";
            const playable = !!g.game?.slug;
            const content = (
              <Card
                sx={{
                  height: "100%",
                  cursor: playable ? "pointer" : "default",
                  border: "none",
                  background: (t) =>
                    `linear-gradient(150deg, ${alpha(t.palette[tone].main, 0.18)}, ${alpha(
                      t.palette[tone].main,
                      0.06,
                    )})`,
                  transition: "transform .2s ease, box-shadow .2s ease",
                  "&:hover": playable
                    ? { transform: "translateY(-4px)", boxShadow: 6 }
                    : undefined,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        fontSize: 24,
                        bgcolor: (t) => alpha(t.palette[tone].main, 0.25),
                        color: `${tone}.main`,
                      }}
                    >
                      {done ? "✅" : "🎯"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ color: "text.primary" }}>
                        {localizedField(g.game, "title", lng)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        <Box component="span" aria-hidden>{done ? "🎉" : "▶"}</Box>{" "}
                        {gameStatusLabel(txt, g.status)}
                      </Typography>
                    </Box>
                    {playable && (
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: `${tone}.main`,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        <MdPlayArrow size={24} />
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
            return (
              <Grid key={g.id} size={{ xs: 12, sm: 6, md: 4 }}>
                {playable ? (
                  <Box
                    component={Link}
                    href={localePath(lng, `/dashboard/games/${g.game.slug}`)}
                    sx={{ textDecoration: "none", display: "block", height: "100%" }}
                  >
                    {content}
                  </Box>
                ) : (
                  content
                )}
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
}
