# react-native-lighthouse 🏠

**Core Web Vitals performance measurement for React Native.** Get Lighthouse-style performance scores for your mobile app components.

## 🤔 The Challenge

Indeed had traditionally been a web company. Site speed wasn't just a nice-to-have — it was fundamental to how we built systems. We believed good software was always fast, and for many years now, we had relied on Lighthouse to keep us honest. 

In the past we’ve written in depth on this topic, but as we’ve transitioned to a Mobile App first company, we needed a way of bringing the same performance rigor to our native code. 

As React Native proliferated across our most critical pages— ViewJob, SERP, Homepage — we found ourselves flying blind. We had no standardized way to measure whether our mobile performance was improving, degrading, or holding steady. We needed answers to fundamental questions: How fast did our screens load? When could users actually interact with them? Were we maintaining the performance standards that Indeed was known for?

## 💡 The Solution: Core Web Vitals for React Native

Rather than reinvent the wheel, we looked to the industry standards that had proven effective on the web: Core Web Vitals. These metrics — designed by Google to capture the essence of user experience — translated remarkably well to mobile apps. We just needed to adapt them for React Native's unique threading model and lifecycle.


## ✨ Features

- 📊 **Three Core Metrics** — TTFF, TTI, and FID (mapped from web Core Web Vitals)
- 🎯 **Lighthouse-Style Scoring** — 0-100 performance score with category ratings
- 🪝 **Simple Hook API** — Drop-in integration with any React Native component
- 📱 **Mobile-Optimized Thresholds** — Stricter than web, calibrated for native apps
- 🔧 **Zero Dependencies** — Only requires React Native (no external packages)
- 📈 **Analytics Ready** — Easy integration with any analytics service

## 📦 Installation

```bash
npm install react-native-lighthouse
# or
yarn add react-native-lighthouse
# or
pnpm add react-native-lighthouse
```

## 🚀 Quick Start

```tsx
import { usePerformanceMeasurement } from 'react-native-lighthouse';

function ProductScreen({ productId }) {
  const { markInteractive, panResponder, score } = usePerformanceMeasurement({
    componentName: 'ProductScreen',
    onReport: (metrics, score) => {
      // Send to your analytics
      analytics.track('screen_performance', {
        screen: 'ProductScreen',
        ttff: metrics.timeToFirstFrameMs,
        tti: metrics.timeToInteractiveMs,
        fid: metrics.firstInputDelay?.firstInputDelayMs,
        score: score.overall,
      });
    },
  });

  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetchProduct(productId).then(setProduct);
  }, [productId]);

  // Mark interactive when data is loaded
  useEffect(() => {
    if (product) {
      markInteractive();
    }
  }, [product, markInteractive]);

  return (
    <View {...panResponder.panHandlers}>
      {product ? <ProductContent product={product} /> : <Loading />}
    </View>
  );
}
```

## 📊 Metrics Explained

### Time to First Frame (TTFF)
**When users first see content** — Maps to LCP (Largest Contentful Paint)

Measured from component mount to when the first frame is rendered. This tells you how quickly users see something on screen.

### Time to Interactive (TTI)
**When users can interact** — The most critical metric for mobile apps

Measured from component mount to when you call `markInteractive()`. Call this when your component is ready for user interaction (data loaded, UI ready).

### First Input Delay (FID)
**Input responsiveness** — Maps to INP/TBT (Interaction to Next Paint)

Measured automatically when users first touch the screen. Uses PanResponder to capture the delay between user input and when processing begins.

## 🎯 Performance Thresholds

These are **aspirational thresholds** designed for high-performance native apps. They are stricter than official platform guidelines and based on human perception research.

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| TTFF | < 300ms | 300-800ms | > 800ms |
| TTI | < 500ms | 500-1500ms | > 1500ms |
| FID | < 50ms | 50-150ms | > 150ms |

### Threshold Rationale

#### TTFF (< 300ms good)
Based on [Jakob Nielsen's response time research](https://www.nngroup.com/articles/response-times-3-important-limits/), **100ms feels instantaneous** to users. Our 300ms "good" threshold provides buffer while staying well under the 1-second limit where users lose their flow of thought. There is no official native mobile standard for component-level render times.

#### TTI (< 500ms good)  
Derived from Google's app startup guidelines. [Google Play considers cold starts > 5 seconds as "bad behavior"](https://support.google.com/googleplay/android-developer/answer/9844486), with industry best practice targeting < 2 seconds. For individual components (assuming ~4 major components per screen), 500ms keeps total screen TTI under 2 seconds.

#### FID (< 50ms good)
Well-supported by academic research. Studies show users can [perceive touch latency as low as 5-10ms](https://dl.acm.org/doi/10.1145/2556288.2557037) during drag operations, and commercial devices currently have 50-200ms latency. Our 50ms threshold aligns with the upper bound of imperceptible delay.

### Comparison to Official Standards

| Source | Metric | Threshold |
|--------|--------|-----------|
| **Google Play (Android Vitals)** | Cold start "bad" | > 5 seconds |
| **Google Play** | Warm start "bad" | > 2 seconds |
| **Google Play** | Frozen frame | > 700ms |
| **Web Core Web Vitals** | LCP good | < 2,500ms |
| **Web Core Web Vitals** | INP good | < 200ms |
| **Jakob Nielsen** | "Instantaneous" | < 100ms |
| **Jakob Nielsen** | "Flow maintained" | < 1,000ms |

Our thresholds are intentionally stricter because:
- ✅ Native apps have pre-bundled code (no network fetch for JS/HTML)
- ✅ No parsing overhead (unlike web browsers)
- ✅ Users expect native apps to feel faster than web
- ✅ Component-level measurement (not full app startup)

### Custom Thresholds

If the default thresholds don't fit your use case, you can provide your own:

```ts
import { calculatePerformanceScore } from 'react-native-lighthouse';

// More lenient thresholds aligned with Google's app startup guidelines
const relaxedThresholds = {
  ttff: { good: 1000, poor: 3000 },
  tti: { good: 2000, poor: 5000 },
  fid: { good: 100, poor: 300 },
};

const score = calculatePerformanceScore(metrics, relaxedThresholds);
```

## 📈 Scoring System

Metrics are combined into a single 0-100 score using weighted averages:

| Metric | Weight | Rationale |
|--------|--------|-----------|
| TTI | 45% | Mobile users expect immediate interactivity |
| FID | 30% | Touch interactions must feel instant |
| TTFF | 25% | Visual feedback matters but less than interactivity |

### Score Categories

| Score | Category | Meaning |
|-------|----------|---------|
| 90-100 | Excellent | Exceptional performance |
| 75-89 | Good | Solid performance |
| 50-74 | Needs Improvement | Noticeable issues |
| 0-49 | Poor | Significant problems |

## 📖 API Reference

### `usePerformanceMeasurement(options)`

Main hook for measuring component performance.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `componentName` | `string` | **required** | Name for identification in logs |
| `namespace` | `string` | `undefined` | Group prefix (e.g., 'checkout', 'profile') |
| `fidTimeout` | `number` | `5000` | Ms to wait for FID before logging |
| `debug` | `boolean` | `__DEV__` | Enable console logging |
| `onMetricsReady` | `function` | `undefined` | Called when metrics update |
| `onInteractive` | `function` | `undefined` | Called when markInteractive() is called |
| `onReport` | `function` | `undefined` | Called with final metrics and score |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `markInteractive` | `() => void` | Call when component is ready for interaction |
| `metrics` | `PerformanceMetrics \| null` | Current performance metrics |
| `panResponder` | `PanResponder` | Attach to root View for FID measurement |
| `score` | `PerformanceScore \| null` | Current Lighthouse-style score |

### `calculatePerformanceScore(metrics, thresholds?, weights?)`

Calculate a performance score from metrics.

```ts
import { calculatePerformanceScore } from 'react-native-lighthouse';

const score = calculatePerformanceScore({
  timeToFirstFrameMs: 250,
  timeToInteractiveMs: 400,
  mountStartTimeMs: 1000,
  firstFrameTimeMs: 1250,
});

console.log(score);
// { overall: 95, breakdown: { ttff: 100, tti: 100, fid: 100 }, category: 'excellent' }
```


## 🧩 Examples

### Basic Usage

```tsx
function HomeScreen() {
  const { markInteractive, panResponder } = usePerformanceMeasurement({
    componentName: 'HomeScreen',
  });

  const [data, setData] = useState(null);

  useEffect(() => {
    loadHomeData().then((data) => {
      setData(data);
      markInteractive();
    });
  }, [markInteractive]);

  return (
    <ScrollView {...panResponder.panHandlers}>
      {data ? <HomeContent data={data} /> : <Skeleton />}
    </ScrollView>
  );
}
```

### With Analytics Integration

```tsx
function CheckoutScreen() {
  const { markInteractive, panResponder, score } = usePerformanceMeasurement({
    componentName: 'CheckoutScreen',
    namespace: 'checkout',
    onReport: (metrics, score) => {
      // Amplitude
      amplitude.track('screen_performance', {
        screen_name: 'checkout',
        ttff_ms: metrics.timeToFirstFrameMs,
        tti_ms: metrics.timeToInteractiveMs,
        fid_ms: metrics.firstInputDelay?.firstInputDelayMs ?? null,
        score: score.overall,
        category: score.category,
      });

      // Or Firebase
      analytics().logEvent('performance', {
        component: 'CheckoutScreen',
        score: score.overall,
      });
    },
  });

  // ... rest of component
}
```

### Conditional Interactivity

```tsx
function SearchResults({ query }) {
  const { markInteractive, panResponder } = usePerformanceMeasurement({
    componentName: 'SearchResults',
  });

  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    searchAPI(query)
      .then(setResults)
      .finally(() => setIsLoading(false));
  }, [query]);

  // Mark interactive only when we have results and loading is complete
  useEffect(() => {
    if (!isLoading && results) {
      markInteractive();
    }
  }, [isLoading, results, markInteractive]);

  return (
    <FlatList
      {...panResponder.panHandlers}
      data={results}
      renderItem={({ item }) => <ResultItem item={item} />}
      ListEmptyComponent={isLoading ? <Loading /> : <NoResults />}
    />
  );
}
```

### Multiple Components

Track performance for nested components:

```tsx
function ProductDetailScreen() {
  const { markInteractive: markScreenInteractive, panResponder } = usePerformanceMeasurement({
    componentName: 'ProductDetailScreen',
    namespace: 'product',
  });

  return (
    <ScrollView {...panResponder.panHandlers}>
      <ProductHeader />
      <ProductGallery />
      <ProductActions onReady={markScreenInteractive} />
    </ScrollView>
  );
}

function ProductActions({ onReady }) {
  const { markInteractive } = usePerformanceMeasurement({
    componentName: 'ProductActions',
    namespace: 'product',
    onInteractive: onReady, // Chain to parent
  });

  const [inventory, setInventory] = useState(null);

  useEffect(() => {
    checkInventory().then((data) => {
      setInventory(data);
      markInteractive();
    });
  }, [markInteractive]);

  return <ActionButtons inventory={inventory} />;
}
```

## 🔧 TypeScript

Full TypeScript support with exported types:

```ts
import type {
  PerformanceMetrics,
  PerformanceScore,
  PerformanceHookResult,
  UsePerformanceMeasurementOptions,
  PerformanceThresholds,
  MetricWeights,
} from 'react-native-lighthouse';
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [Your Name]

---

<p align="center">
  <sub>Built with ❤️ for the React Native community</sub>
</p>
