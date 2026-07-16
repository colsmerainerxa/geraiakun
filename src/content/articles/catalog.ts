import { aiForThesisResearch } from "./ai-for-thesis-research"
import { aiStackForStudents } from "./ai-stack-for-students"
import { aiSubscriptionGuide } from "./ai-subscription-guide"
import { apiKeyBeginners } from "./api-key-beginners"
import { chatgptPaidVsFree } from "./chatgpt-paid-vs-free"
import { chatgptVsGemini } from "./chatgpt-vs-gemini"
import { safeDigitalSubscriptions } from "./safe-digital-subscriptions"
import { validateArticleCatalog } from "./schema"
import { sharedVsPrivate } from "./shared-vs-private"
import { tokenCostEstimation } from "./token-cost-estimation"
import { whatsappAiBot } from "./whatsapp-ai-bot"

export const articleCatalog = validateArticleCatalog([
  aiSubscriptionGuide,
  chatgptPaidVsFree,
  chatgptVsGemini,
  aiStackForStudents,
  aiForThesisResearch,
  apiKeyBeginners,
  tokenCostEstimation,
  whatsappAiBot,
  sharedVsPrivate,
  safeDigitalSubscriptions,
])
