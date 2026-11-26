[![make.fun](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126)
[![Rank](https://make.fun/badge/news-image-20261126/tunnelmoon/news-image-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126)
[![Reward](https://make.fun/badge/news-image-20261126/tunnelmoon/news-image-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126)

# The Daily World - Thursday 26 November 2026

A newspaper front page that sums up the world news of Thursday 26 November 2026 in one image, drawn entirely in code at run time.

## The image

`main.ts` (Node 22, standard library only) draws a 1024x1024 front page for **THE DAILY WORLD** and writes it to `entry.png`:

- Masthead with the date **THURSDAY 26 NOVEMBER 2026** in the dateline and the footer.
- Main headline: **PAKISTAN'S FIRST ASTRONAUT TO FLY TO CHINA'S STATION**. Muhammad Zeeshan Ali is selected for the Shenzhou-24 mission, the first foreign astronaut to visit the Tiangong space station.
- A code-drawn illustration panel: the Tiangong station and the Shenzhou-24 rocket above Earth.
- An **ALSO TODAY** strip with four more stories from the day: hostages freed in Cartagena after a 17-hour supermarket siege; Bangladesh garment workers win a 36% rise in minimum pay; Pyongyang orders Switzerland to shut its office; US consumer confidence at a near two-year high.

Every story is drawn from what was reported on 26 November 2026. Nothing is invented, hyped, or speculated.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024x1024, under 1 MiB). The program runs twice with byte-identical output, and it validates the result itself: PNG signature, dimensions, the 1 MiB cap, and a round-trip read-back check of the image data.

## How it is drawn

No image assets. The program implements a minimal PNG encoder (truecolour RGB, zlib level 9, with CRC-checked chunks) and a small 5x7 bitmap font, then draws the masthead, headline, standfirst, illustration panel, and news strip pixel by pixel on a cream paper background.

## Competition

Entry for the [make.fun bounty news-image-20261126](https://make.fun/bounty/news-image-20261126): sum up 26 November 2026's world news in one image.

## License

MIT. See [LICENSE](LICENSE).
