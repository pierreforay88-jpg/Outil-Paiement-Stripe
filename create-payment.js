import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, accountId, amount, commissionAmount, description, partnerName } = req.body;

  if (!apiKey || !accountId || !amount || commissionAmount === undefined) {
    return res.status(400).json({ error: 'Paramètres manquants.' });
  }

  if (!apiKey.startsWith('sk_')) {
    return res.status(400).json({ error: 'Clé API Stripe invalide.' });
  }

  try {
    const stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });

    // Create a payment link with destination charge (split)
    // The commission goes to the platform (us), the rest to the connected account
    const partnerAmount = amount - commissionAmount;

    const session = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: description || `Prestation — ${partnerName}`,
            },
            unit_amount: amount, // total in cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_data: {
          destination: accountId,
          amount: partnerAmount, // amount going to partner (rest stays as commission)
        },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
