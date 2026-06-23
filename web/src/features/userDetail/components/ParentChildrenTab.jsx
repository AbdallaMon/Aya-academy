"use client";

import {
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { MdVisibility } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { levelLabel, personLabel } from "../config/constant.js";

/** Parent's children table with a details link per child. */
export default function ParentChildrenTab({ overview, txt, canView }) {
  const { lng } = useTranslation();
  const children = overview?.children || [];

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
          {txt.childrenTitle}
        </Typography>
        {children.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {txt.noChildren}
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{txt.childName}</TableCell>
                <TableCell>{txt.childLevel}</TableCell>
                <TableCell>{txt.childPoints}</TableCell>
                <TableCell>{txt.childSubscription}</TableCell>
                <TableCell>{txt.childCertificates}</TableCell>
                {canView && <TableCell align="right" />}
              </TableRow>
            </TableHead>
            <TableBody>
              {children.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{personLabel(c)}</TableCell>
                  <TableCell>{levelLabel(c.studentLevel, lng)}</TableCell>
                  <TableCell>{c.points ?? 0}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={c.activeSubscription ? "success" : "default"}
                      variant={c.activeSubscription ? "filled" : "outlined"}
                      label={c.activeSubscription ? txt.subscribed : txt.notSubscribed}
                    />
                  </TableCell>
                  <TableCell>{c.certificatesCount ?? 0}</TableCell>
                  {canView && (
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<MdVisibility />}
                        component={Link}
                        href={localePath(lng, `/dashboard/users/${c.id}`)}
                      >
                        {txt.details}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
