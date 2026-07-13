"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useGlobeStore, type PendingPin } from "@/lib/store";
import { createLocation } from "@/lib/data/locations";
import { reverseGeocode } from "@/lib/geocode";
import { formatCoords } from "@/lib/geo";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

/** Confirms a pendingPin into a persisted location row. */
export default function AddLocationDialog() {
  const pendingPin = useGlobeStore((s) => s.pendingPin);
  const setPendingPin = useGlobeStore((s) => s.setPendingPin);

  return (
    <Dialog
      open={pendingPin !== null}
      title="PIN THIS LOCATION"
      onClose={() => setPendingPin(null)}
    >
      {pendingPin && (
        <PinForm
          // Remount per pin so all local state resets cleanly.
          key={`${pendingPin.lat}:${pendingPin.lon}:${pendingPin.suggestedName ?? ""}`}
          pin={pendingPin}
        />
      )}
    </Dialog>
  );
}

function PinForm({ pin }: { pin: PendingPin }) {
  const [name, setName] = useState(pin.suggestedName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const touchedRef = useRef(false);
  // Guard keyed on the pin: reverse geocoding fires at most once per pin.
  const reverseFiredForRef = useRef<string | null>(null);

  useEffect(() => {
    const pinKey = `${pin.lat}:${pin.lon}`;
    if (pin.suggestedName || reverseFiredForRef.current === pinKey) return;
    reverseFiredForRef.current = pinKey;
    let cancelled = false;
    reverseGeocode(pin.lat, pin.lon).then((resolved) => {
      if (cancelled || !resolved) return;
      // Prefill ONLY if the user hasn't typed anything meanwhile.
      if (!touchedRef.current) {
        setName((current) => (touchedRef.current ? current : resolved));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pin]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const row = await createLocation({
        name: trimmed,
        latitude: pin.lat,
        longitude: pin.lon,
      });
      const store = useGlobeStore.getState();
      store.upsertLocation(row);
      store.selectLocation(row.id);
      store.setPendingPin(null);
    } catch (err) {
      setSaving(false);
      setError(
        err instanceof Error ? err.message : "FAILED TO SAVE LOCATION",
      );
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-4"
    >
      <div>
        <span className="label">COORDINATES</span>
        <p className="mt-1 font-mono text-sm">
          {formatCoords(pin.lat, pin.lon)}
        </p>
      </div>

      <Field label="NAME" htmlFor="pin-name">
        <Input
          id="pin-name"
          value={name}
          onChange={(e) => {
            touchedRef.current = true;
            setName(e.target.value);
          }}
          placeholder="NAME THIS PLACE…"
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
      </Field>

      {error && <p className="error-block">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => useGlobeStore.getState().setPendingPin(null)}
          disabled={saving}
        >
          CANCEL
        </Button>
        <Button
          type="submit"
          variant="invert"
          disabled={name.trim().length === 0 || saving}
        >
          {saving ? "SAVING…" : "SAVE LOCATION"}
        </Button>
      </div>
    </form>
  );
}
