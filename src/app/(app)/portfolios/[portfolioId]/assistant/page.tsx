import { requireUser } from '@/server/auth/session';
import { getPortfolioForPage } from '@/server/auth/page-data';
import { withPageErrorHandling } from '@/server/auth/page-error';
import AssistantChat from '@/components/assistant/assistant-chat';

interface Props {
  params: Promise<{ portfolioId: string }>;
}

const AssistantPage = async ({ params }: Props) => {
  const { portfolioId } = await params;

  const ctx = await withPageErrorHandling(() => requireUser());

  const portfolio = await withPageErrorHandling(() =>
    getPortfolioForPage(ctx.userId, portfolioId),
  );

  return (
    <AssistantChat
      key={portfolioId}
      portfolioId={portfolioId}
      portfolioName={portfolio.name}
    />
  );
};

export default AssistantPage;
