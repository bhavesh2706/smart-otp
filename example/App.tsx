import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  Button,
  Dimensions,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { StatusBar } from 'expo-status-bar';
import {
  SmartOTPInput,
  getFilledTheme,
  getMinimalTheme,
  getOutlinedTheme,
  useCountdown,
  useOtpAutofill,
  type OTPCellRenderInfo,
  type SmartOTPInputProps,
  type SmartOTPInputRef,
  type SmartOTPTheme,
} from 'react-native-smart-otp';

const EXPECTED = '123456';

/** Screen recordings from a physical Android device (included in `assets/demo/`). */
const ANDROID_DEMOS = [
  {
    source: require('./assets/demo/android-otp-demo-1.gif'),
    caption: 'Kitchen-sink overview — scroll through every feature section.',
  },
  {
    source: require('./assets/demo/android-otp-demo-2.gif'),
    caption: 'Verify flow — wrong code triggers error shake + keyboard.',
  },
] as const;

type Scheme = 'light' | 'dark';

/** Current color scheme, shared so demos and the chrome don't prop-drill it. */
const SchemeContext = createContext<{ scheme: Scheme; dark: boolean }>({
  scheme: 'light',
  dark: false,
});
const useScheme = () => useContext(SchemeContext);

/**
 * Lets a focused OTP input scroll itself above the keyboard. The App provides
 * the scroller; each {@link KbAwareOTP} reports its on-screen rect on focus.
 */
const ScrollIntoViewContext = createContext<(node: View | null) => void>(
  () => undefined
);

/**
 * Drop-in `SmartOTPInput` that scrolls above the keyboard when focused — the
 * keyboard-avoidance pattern recommended in the README (uses the `onFocus`
 * prop). Forwards the ref and all props through.
 */
const KbAwareOTP = forwardRef<SmartOTPInputRef, SmartOTPInputProps>(
  function KbAwareOTP(props, ref) {
    const scrollIntoView = useContext(ScrollIntoViewContext);
    const wrapRef = useRef<View>(null);
    return (
      <View ref={wrapRef} collapsable={false}>
        <SmartOTPInput
          {...props}
          ref={ref}
          onFocus={() => {
            props.onFocus?.();
            scrollIntoView(wrapRef.current);
          }}
        />
      </View>
    );
  }
);

/** A titled section wrapper with an optional caption. */
function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {caption ? (
        <ThemedText muted style={styles.caption}>
          {caption}
        </ThemedText>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/** Muted helper line shown under a demo. */
function Hint({ children }: { children: ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
}

/**
 * `Text` that resolves its dark-mode color automatically from the scheme
 * context. `muted` picks the secondary (grey) tone; otherwise the primary tone.
 * Consolidates the repeated `[baseStyle, dark && styles.textDark|muted]` idiom.
 */
function ThemedText({
  muted = false,
  style,
  children,
}: {
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  const { dark } = useScheme();
  return (
    <Text style={[style, dark && (muted ? styles.muted : styles.textDark)]}>
      {children}
    </Text>
  );
}

/** 1. Numeric verify with success / error states + animations. */
function VerifyDemo() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  return (
    <>
      <KbAwareOTP
        length={6}
        value={code}
        onChange={(c) => {
          setCode(c);
          setStatus('idle');
        }}
        onComplete={(c) => setStatus(c === EXPECTED ? 'success' : 'error')}
        error={status === 'error'}
        success={status === 'success'}
        autoFocus
        accessibilityLabel="Verification code"
      />
      <Hint>
        {status === 'success'
          ? '✅ Verified!'
          : status === 'error'
            ? '❌ Wrong — try 123456'
            : 'Type 123456 for success, anything else for error (shake).'}
      </Hint>
    </>
  );
}

/** 2. Imperative ref API: focus / blur / clear / setValue. */
function RefDemo() {
  const ref = useRef<SmartOTPInputRef>(null);
  return (
    <>
      <KbAwareOTP length={6} ref={ref} />
      <View style={styles.row}>
        <Button title="Focus" onPress={() => ref.current?.focus()} />
        <Button title="Blur" onPress={() => ref.current?.blur()} />
        <Button title="Clear" onPress={() => ref.current?.clear()} />
        <Button
          title="Set 654321"
          onPress={() => ref.current?.setValue('654321')}
        />
      </View>
    </>
  );
}

/** 3. Masked 4-digit PIN. */
function MaskDemo() {
  const [pin, setPin] = useState('');
  return (
    <>
      <KbAwareOTP length={4} value={pin} onChange={setPin} mask />
      <Hint>Hidden value: {pin || '(empty)'}</Hint>
    </>
  );
}

/** 4. Alphanumeric, custom keyboard. */
function AlphanumericDemo() {
  const [v, setV] = useState('');
  return (
    <>
      <KbAwareOTP length={5} value={v} onChange={setV} type="alphanumeric" />
      <Hint>Letters + digits. Value: {v || '(empty)'}</Hint>
    </>
  );
}

/** 5. Placeholder + per-state style overrides. */
function PlaceholderDemo() {
  return (
    <KbAwareOTP
      length={4}
      placeholder="–"
      placeholderTextColor="#C0C4C8"
      theme={getMinimalTheme('light')}
    />
  );
}

/** 6. Theme switcher. */
function ThemeDemo() {
  const { scheme } = useScheme();
  const [name, setName] = useState<'outlined' | 'filled' | 'minimal'>(
    'outlined'
  );
  const theme = useMemo<SmartOTPTheme>(() => {
    if (name === 'filled') return getFilledTheme(scheme);
    if (name === 'minimal') return getMinimalTheme(scheme);
    return getOutlinedTheme(scheme);
  }, [name, scheme]);
  return (
    <>
      <KbAwareOTP length={6} theme={theme} defaultValue="42" />
      <View style={styles.chips}>
        {(['outlined', 'filled', 'minimal'] as const).map((n) => (
          <Pressable
            key={n}
            onPress={() => setName(n)}
            style={[styles.chip, name === n && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, name === n && styles.chipTextActive]}
            >
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

/** 7. Live state toggles: disabled / error / success / editableCells. */
function ToggleDemo() {
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editableCells, setEditable] = useState(true);
  const toggles: Array<[string, boolean, (v: boolean) => void]> = [
    ['disabled', disabled, setDisabled],
    ['error', error, setError],
    ['success', success, setSuccess],
    ['editableCells', editableCells, setEditable],
  ];
  return (
    <>
      <KbAwareOTP
        length={6}
        defaultValue="1234"
        disabled={disabled}
        error={error}
        success={success}
        editableCells={editableCells}
      />
      {toggles.map(([label, val, set]) => (
        <View key={label} style={styles.toggleRow}>
          <ThemedText style={styles.toggleLabel}>{label}</ThemedText>
          <Switch value={val} onValueChange={set} />
        </View>
      ))}
      <Hint>
        Turn off editableCells to compare: caret then stays at the end.
      </Hint>
    </>
  );
}

/** 8. Resend countdown timer. */
function TimerDemo() {
  const { timeLeft, isRunning, start, reset } = useCountdown({
    duration: 15,
    autoStart: true,
  });
  return (
    <View style={styles.row}>
      <Text style={styles.timer}>
        {isRunning ? `Resend in ${timeLeft}s` : 'Ready'}
      </Text>
      <Button title="Start" onPress={start} disabled={isRunning} />
      <Button title="Reset" onPress={reset} />
    </View>
  );
}

/** 9. Fully custom cells via renderCell. */
function RenderCellDemo() {
  const [v, setV] = useState('');
  const renderCell = useCallback(
    ({ char, isFocused, hasValue }: OTPCellRenderInfo) => (
      <View
        style={[
          styles.customCell,
          hasValue && styles.customCellFilled,
          isFocused && styles.customCellActive,
        ]}
      >
        <Text style={styles.customCellText}>{char || '·'}</Text>
      </View>
    ),
    []
  );
  return (
    <KbAwareOTP length={4} value={v} onChange={setV} renderCell={renderCell} />
  );
}

/** 10. Unified auto-fill + capability readout. */
function AutofillDemo() {
  const [code, setCode] = useState('');
  const { capabilities, checkClipboard } = useOtpAutofill({
    length: 6,
    onCode: setCode,
  });
  return (
    <>
      <KbAwareOTP length={6} value={code} onChange={setCode} />
      <View style={styles.row}>
        <Button
          title="Copy 987654"
          onPress={() => Clipboard.setString('Your code is 987654')}
        />
        <Button title="Clear" onPress={() => setCode('')} />
        <Button title="Check clipboard" onPress={checkClipboard} />
      </View>
      <ThemedText muted style={styles.caps}>
        {`platform: ${capabilities.platform}\n` +
          `iOS oneTimeCode: ${capabilities.iosOneTimeCode}\n` +
          `Android SMS retriever: ${capabilities.androidSmsRetriever}\n` +
          `Android SMS user-consent: ${capabilities.androidSmsUserConsent}\n` +
          `clipboard: ${capabilities.clipboard}`}
      </ThemedText>
      <Hint>
        Copy a 6-digit code, leave the app and return — it auto-fills.
      </Hint>
    </>
  );
}

/** The single source of truth for the demo screen — add a row, get a section. */
const SECTIONS: ReadonlyArray<{
  title: string;
  caption?: string;
  Component: ComponentType;
}> = [
  {
    title: '1. Verify (success / error + animations)',
    caption: 'onComplete fires, cells turn green/red, error shakes.',
    Component: VerifyDemo,
  },
  {
    title: '2. Imperative ref API',
    caption: 'focus() · blur() · clear() · setValue()',
    Component: RefDemo,
  },
  { title: '3. Masked PIN (secure entry)', Component: MaskDemo },
  { title: '4. Alphanumeric input', Component: AlphanumericDemo },
  { title: '5. Placeholder + Minimal theme', Component: PlaceholderDemo },
  { title: '6. Themes', Component: ThemeDemo },
  {
    title: '7. Live state toggles',
    caption: 'disabled / error / success / editableCells',
    Component: ToggleDemo,
  },
  { title: '8. Resend timer (useCountdown)', Component: TimerDemo },
  {
    title: '9. Custom cells (renderCell)',
    caption: 'Bring your own cell UI.',
    Component: RenderCellDemo,
  },
  {
    title: '10. Auto-fill + capabilities',
    caption: 'useOtpAutofill: SMS + clipboard, platform support.',
    Component: AutofillDemo,
  },
];

export default function App() {
  const scheme: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const dark = scheme === 'dark';
  const schemeValue = useMemo(() => ({ scheme, dark }), [scheme, dark]);

  // Keyboard-avoidance: scroll the focused OTP input above the keyboard.
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const kbHeightRef = useRef(0);
  const focusedNodeRef = useRef<View | null>(null);

  const ensureVisible = useCallback((node: View | null) => {
    if (!node || kbHeightRef.current === 0) {
      return;
    }
    node.measureInWindow((_x, y, _w, h) => {
      const screenH = Dimensions.get('window').height;
      const keyboardTop = screenH - kbHeightRef.current;
      const overlap = y + h + 24 - keyboardTop;
      if (overlap > 0) {
        scrollRef.current?.scrollTo({
          y: offsetRef.current + overlap,
          animated: true,
        });
      }
    });
  }, []);

  useEffect(() => {
    // Run after `keyboardDidShow` so the real keyboard height is known (the
    // focus event fires before the keyboard frame is final).
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      kbHeightRef.current = e.endCoordinates.height;
      ensureVisible(focusedNodeRef.current);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      kbHeightRef.current = 0;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [ensureVisible]);

  const scrollIntoView = useCallback(
    (node: View | null) => {
      focusedNodeRef.current = node;
      // If the keyboard is already up (switching between inputs), scroll now.
      ensureVisible(node);
    },
    [ensureVisible]
  );

  return (
    <SchemeContext.Provider value={schemeValue}>
      <View style={[styles.screen, dark && styles.screenDark]}>
        <StatusBar style="auto" />
        <ScrollView
          ref={scrollRef}
          onScroll={(e) => {
            offsetRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={styles.content}
          // Android resizes the window itself (adjustResize); the per-input
          // onFocus scroll above handles iOS, where nothing auto-scrolls a
          // custom input above the keyboard.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <ScrollIntoViewContext.Provider value={scrollIntoView}>
            <ThemedText style={styles.title}>
              react-native-smart-otp
            </ThemedText>
            <ThemedText muted style={styles.subtitle}>
              Every feature, one screen. Tap any cell to edit it.
            </ThemedText>

            <Section
              title="Android demos"
              caption="Recorded on a physical device (New Architecture)."
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.demoRow}
              >
                {ANDROID_DEMOS.map(({ source, caption }) => (
                  <View key={caption} style={styles.demoCard}>
                    <Image
                      source={source}
                      style={styles.demoGif}
                      resizeMode="contain"
                      accessibilityLabel={caption}
                    />
                    <ThemedText muted style={styles.demoCaption}>
                      {caption}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            </Section>

            {SECTIONS.map(({ title, caption, Component }) => (
              <Section key={title} title={title} caption={caption}>
                <Component />
              </Section>
            ))}

            <View style={styles.footer} />
          </ScrollIntoViewContext.Provider>
        </ScrollView>
      </View>
    </SchemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  screenDark: { backgroundColor: '#101317' },
  content: { padding: 20, paddingTop: 64 },
  title: { fontSize: 24, fontWeight: '800', color: '#11181C' },
  subtitle: { fontSize: 14, color: '#5A6168', marginTop: 4, marginBottom: 8 },
  textDark: { color: '#ECEDEE' },
  muted: { color: '#9BA1A6' },

  section: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D0D7DE',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#11181C' },
  caption: { fontSize: 13, color: '#5A6168', marginTop: 2 },
  sectionBody: { marginTop: 14, gap: 10 },

  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  hint: { fontSize: 13, color: '#5A6168' },

  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D0D7DE',
  },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { color: '#5A6168', textTransform: 'capitalize', fontSize: 13 },
  chipTextActive: { color: '#FFFFFF' },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: { fontSize: 14, color: '#11181C' },

  timer: { fontSize: 15, fontWeight: '600', color: '#007AFF', minWidth: 120 },

  customCell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF1F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCellFilled: { backgroundColor: '#D6E4FF' },
  customCellActive: { borderWidth: 2, borderColor: '#007AFF' },
  customCellText: { fontSize: 20, fontWeight: '700', color: '#11181C' },

  caps: { fontFamily: 'monospace', fontSize: 12, color: '#5A6168' },

  demoRow: { gap: 16, paddingVertical: 4 },
  demoCard: { width: 200 },
  demoGif: { width: 200, height: 444, borderRadius: 12 },
  demoCaption: { fontSize: 12, marginTop: 8, lineHeight: 16 },

  // Tall footer gives the last sections room to scroll above the keyboard.
  footer: { height: 360 },
});
