export const Form = () => {
  return (
    <form action="/api/create-checkout-session" method="POST" className="space-y-4">
      <label className="block text-sm font-medium">
        金額（円）
        <input
          type="number"
          name="amount"
          min={50}
          max={1000000}
          step={1}
          defaultValue={1000}
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
      >
        支払う
      </button>
    </form>
  );
};
