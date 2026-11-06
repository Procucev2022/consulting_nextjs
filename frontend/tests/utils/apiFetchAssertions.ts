import { expect } from 'vitest';
import { API_REQUEST_ID_HEADER } from '../../src/constants/app';

type FetchCall = [RequestInfo | URL, RequestInit?];

const getFetchCalls = (fetchMock: unknown): FetchCall[] => {
  const mock = fetchMock as { mock?: { calls?: unknown[][] } };
  return (mock.mock?.calls ?? []) as FetchCall[];
};
const getHeadersWithoutRequestId = (headersInit?: HeadersInit): Record<string, string> => {
  const headers = new Headers(headersInit);
  headers.delete(API_REQUEST_ID_HEADER);
  return Object.fromEntries(headers.entries());
};

const unwrapMatcher = (value: unknown): { sample: unknown; partial: boolean } => {
  if (typeof value === 'object' && value !== null && 'sample' in value) {
    return { sample: (value as { sample: unknown }).sample, partial: true };
  }
  return { sample: value, partial: false };
};

export const expectApiFetchCall = (
  fetchMock: unknown,
  expectedUrl: unknown,
  expectedInit?: unknown,
  callIndex?: number,
): void => {
  const calls = getFetchCalls(fetchMock);
  const selectedCalls = callIndex === undefined
    ? calls
    : [calls[callIndex < 0 ? calls.length - 1 : callIndex - 1]].filter(Boolean);
  const matchingCall = selectedCalls.find(([url]) => {
    try {
      expect(url).toEqual(expectedUrl);
      return true;
    } catch {
      return false;
    }
  });

  expect(matchingCall).toBeDefined();
  expect(matchingCall?.[0]).toEqual(expectedUrl);
  const requestHeaders = new Headers(matchingCall?.[1]?.headers);
  expect(requestHeaders.get(API_REQUEST_ID_HEADER)).toMatch(/^[A-Za-z0-9._:-]+$/u);
  if (expectedInit !== undefined) {
    const initExpectation = unwrapMatcher(expectedInit);
    const expectedOptions = initExpectation.sample as Record<string, unknown>;
    const { headers: expectedHeadersValue, ...expectedOptionsWithoutHeaders } = expectedOptions;
    const actualOptions = { ...matchingCall?.[1] };
    delete actualOptions.headers;
    if (initExpectation.partial) expect(actualOptions).toMatchObject(expectedOptionsWithoutHeaders);
    else expect(actualOptions).toEqual(expectedOptionsWithoutHeaders);

    if (expectedHeadersValue !== undefined) {
      const headersExpectation = unwrapMatcher(expectedHeadersValue);
      const expectedHeaders = headersExpectation.sample;
      const actualHeadersWithoutRequestId = getHeadersWithoutRequestId(matchingCall?.[1]?.headers);
      if (headersExpectation.partial) {
        for (const [name, value] of Object.entries(expectedHeaders as Record<string, string>)) {
          expect(new Headers(actualHeadersWithoutRequestId).get(name)).toBe(value);
        }
      } else {
        expect(actualHeadersWithoutRequestId).toEqual(getHeadersWithoutRequestId(expectedHeaders as HeadersInit));
      }
    }
  }
};

export const expectApiFetchNotCalled = (fetchMock: unknown, expectedUrl: unknown): void => {
  const didCall = getFetchCalls(fetchMock).some(([url]) => {
    try {
      expect(url).toEqual(expectedUrl);
      return true;
    } catch {
      return false;
    }
  });
  expect(didCall).toBe(false);
};
