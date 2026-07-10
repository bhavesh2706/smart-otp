import { Button } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SmartOTPInput } from '../SmartOTPInput';

const INPUT = 'otp-input';

/**
 * Proves `SmartOTPInput` integrates with React Hook Form via `Controller`
 * without any adapter — it is already a controlled `value`/`onChange` field.
 */
interface FormValues {
  readonly otp: string;
}

function OTPForm({ onSubmit }: { onSubmit: (values: FormValues) => void }) {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { otp: '' },
  });
  return (
    <>
      <Controller
        control={control}
        name="otp"
        rules={{ minLength: 6, required: true }}
        render={({ field: { value, onChange } }) => (
          <SmartOTPInput
            length={6}
            value={value}
            onChange={onChange}
            testID={INPUT}
          />
        )}
      />
      <Button title="Submit" onPress={handleSubmit(onSubmit)} />
    </>
  );
}

describe('SmartOTPInput + react-hook-form', () => {
  it('binds to a Controller and submits the entered code', async () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByText } = await render(
      <OTPForm onSubmit={onSubmit} />
    );
    await fireEvent.changeText(getByTestId(INPUT), '246810');
    await fireEvent.press(getByText('Submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ otp: '246810' });
  });

  it('blocks submission when the field is incomplete', async () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByText } = await render(
      <OTPForm onSubmit={onSubmit} />
    );
    await fireEvent.changeText(getByTestId(INPUT), '24');
    await fireEvent.press(getByText('Submit'));
    // Give react-hook-form's async validation a chance to run before asserting.
    await waitFor(() => expect(getByTestId(INPUT).props.value).toBe('24'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
