import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
  TableHeader,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { requireUser } from '@/server/auth/session';
import { ForbiddenError } from '@/server/auth/errors';
import { listAuditLog } from '@/server/services/audit';
import { getPortfolioForPage } from '@/server/auth/page-data';
import { withPageErrorHandling } from '@/server/auth/page-error';

interface Props {
  params: Promise<{ portfolioId: string }>;
}

type AuditEntry = Awaited<ReturnType<typeof listAuditLog>>[number];

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

const actionLabels: Record<string, string> = {
  'transaction.added': 'Added a transaction',
  'proposal.created': 'Assistant proposed a transaction',
  'proposal.confirmed': 'Confirmed an assistant proposal',
  'proposal.cancelled': 'Cancelled an assistant proposal',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const shortId = (value: unknown) =>
  typeof value === 'string' ? value.slice(0, 8) : undefined;

const detailsFor = (entry: AuditEntry) => {
  if (!isRecord(entry.payload)) return '—';

  const details: string[] = [];
  const kind = entry.payload.kind;
  const quantity = entry.payload.quantity;
  const unitPrice = entry.payload.unitPrice;
  const transactionId = shortId(entry.payload.transactionId);
  const proposalId = shortId(entry.payload.proposalId);

  if (typeof kind === 'string') details.push(`Kind: ${kind}`);
  if (typeof quantity === 'string') details.push(`Quantity: ${quantity}`);
  if (typeof unitPrice === 'string') details.push(`Unit price: ${unitPrice}`);
  if (transactionId) details.push(`Transaction: ${transactionId}`);
  if (proposalId) details.push(`Proposal: ${proposalId}`);

  return details.length > 0 ? details.join(' · ') : '—';
};

const ActivityForbidden = () => (
  <Card>
    <CardContent className="py-6 text-sm text-muted-foreground">
      Only owners can view activity
    </CardContent>
  </Card>
);

const ActivityPage = async ({ params }: Props) => {
  const { portfolioId } = await params;
  const ctx = await withPageErrorHandling(() => requireUser());

  await withPageErrorHandling(() =>
    getPortfolioForPage(ctx.userId, portfolioId),
  );

  let entries: AuditEntry[];

  try {
    entries = await withPageErrorHandling(() => listAuditLog(ctx, portfolioId));
  } catch (error) {
    if (error instanceof ForbiddenError) return <ActivityForbidden />;
    throw error;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>
          A record of changes and assistant proposal events.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {dateTimeFormatter.format(new Date(entry.createdAt))}
                  </TableCell>
                  <TableCell>{entry.actorName}</TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {entry.actorKind === 'AGENT' ? 'Via assistant' : 'Direct'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {actionLabels[entry.action] ?? entry.action}
                  </TableCell>
                  <TableCell>{detailsFor(entry)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityPage;
