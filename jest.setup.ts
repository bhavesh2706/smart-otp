/**
 * Jest setup for react-native-smart-otp.
 *
 * The `react-native` preset already mocks the core native modules. We add
 * library-specific setup here as native milestones land (e.g. SMS Retriever
 * mocks in Milestone 3). Keeping this file present from Milestone 1 means the
 * Jest config never needs to change when those mocks are introduced.
 */
import '@testing-library/react-native';
