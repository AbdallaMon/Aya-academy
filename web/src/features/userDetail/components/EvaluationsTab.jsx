"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTranslation } from "../../../i18n/client.js";
import { formatDate } from "../config/constant.js";

function AttemptsTable({ title, rows, emptyLabel, txt, lng }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        {!rows || rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {emptyLabel}
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{txt.score}</TableCell>
                <TableCell>{txt.result}</TableCell>
                <TableCell>{txt.date}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {a.score}
                    {a.totalQuestions != null ? ` / ${a.totalQuestions}` : ""}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={a.passed ? "success" : "default"}
                      variant={a.passed ? "filled" : "outlined"}
                      label={a.passed ? txt.passed : txt.failed}
                    />
                  </TableCell>
                  <TableCell>{formatDate(a.completedAt || a.createdAt, lng)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/** Evaluations: game + quiz attempt tables. */
export default function EvaluationsTab({ overview, txt }) {
  const { lng } = useTranslation();
  const games = overview?.attempts?.games || [];
  const quizzes = overview?.attempts?.quizzes || [];

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <AttemptsTable
          title={txt.gamesTitle}
          rows={games}
          emptyLabel={txt.noGameAttempts}
          txt={txt}
          lng={lng}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <AttemptsTable
          title={txt.quizzesTitle}
          rows={quizzes}
          emptyLabel={txt.noQuizAttempts}
          txt={txt}
          lng={lng}
        />
      </Grid>
    </Grid>
  );
}
