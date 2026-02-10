import { NextRequest, NextResponse } from "next/server";
import { createCheckoutUrl } from "@/lib/lemonsqueezy/actions";
import { getPlanByVariantId } from "@/lib/lemonsqueezy/plans";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, email, userId } = body as {
      variantId?: string;
      email?: string;
      userId?: string;
    };

    if (!variantId) {
      return NextResponse.json(
        { error: "variantId is required" },
        { status: 400 }
      );
    }

    // Validate that this variant belongs to a known plan
    const plan = getPlanByVariantId(variantId);
    if (!plan) {
      return NextResponse.json(
        { error: "Unknown variant ID" },
        { status: 400 }
      );
    }

    const { url } = await createCheckoutUrl({
      variantId,
      userEmail: email,
      userId,
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[checkout] error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
