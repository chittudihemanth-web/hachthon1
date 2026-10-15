// backend/scripts/testGemini.ts
import { geminiService } from '../src/services/gemini.js';

async function testGeminiIntegration() {
  console.log('🤖 Testing live Google Gemini API connectivity...');

  const testPayload = {
    sender: 'billing@enterprise-vendor.com',
    subject: 'Invoice INV-2024-9981 for Cloud Infrastructure',
    vendor: 'CloudCorp Technologies',
    amount: 14850.00,
    currency: 'USD',
    dueDate: '2026-11-01',
    description: 'Quarterly server hosting and managed database services',
  };

  try {
    console.log('⏳ Running entity extraction...');
    const result = await geminiService.extractEntities(testPayload, 'flash');

    console.log('\n✅ Extraction Response:');
    console.log('Model Used:', result.model);
    console.log('Confidence Score:', result.confidence);
    console.log('Tokens In:', result.tokensIn, '| Tokens Out:', result.tokensOut);
    console.log('Output Payload:', JSON.stringify(result.outputPayload, null, 2));

    console.log('\n⏳ Running semantic classification...');
    const classification = await geminiService.classify(testPayload, 'flash');
    console.log('Category:', classification.category);
    console.log('Classification Confidence:', classification.confidence);
    console.log('Reasoning:', classification.reasoning);

    console.log('\n🎉 Gemini API key verified and operational!');
  } catch (err: any) {
    console.error('❌ Gemini test error:', err.message);
  }
}

testGeminiIntegration();
