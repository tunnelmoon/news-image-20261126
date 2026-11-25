[![make.fun](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126)
[![Rank](https://make.fun/badge/news-image-20261126/tunnelmoon/news-image-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126)
[![Reward](https://make.fun/badge/news-image-20261126/tunnelmoon/news-image-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126)

# The Daily World - Thursday 26 November 2026

A make.fun bounty entry for [news-image-20261126](https://make.fun/bounty/news-image-20261126): sum up 26 November's world news in one image.

`main.ts` (Node 22, standard library only) draws the whole newspaper front page in code, a deterministic PNG, and writes it to `(MAKEFUN_OUTPUT_DIR ?? "/output")/entry.png`. No network, no assets, no randomness: two runs write the same bytes.

The front page leads with the day's space story, Pakistan's first astronaut picked for China's Shenzhou-24 mission to the Tiangong station, with a code-drawn rocket, station and Earth panel. The Also Today strip covers the Cartagena hostage rescue, the Bangladesh garment pay rise, North Korea ordering Switzerland's office shut, and US consumer confidence at a near two-year high.

Run it with:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT. See [LICENSE](LICENSE).
