# Real cell image

Müller, M., Mönkemöller, V., Hennig, S., Hübner, W. & Huser, T. (2016). Open-source image reconstruction of super-resolution structured illumination microscopy data in ImageJ. Nature Communications 7, 10980. https://doi.org/10.1038/ncomms10980

Figure 4: LSEC membrane stained with CellMask Deep Red, DeltaVision OMX. Panel a: widefield. Panel c: single-slice fairSIM reconstruction. CC BY 4.0: https://creativecommons.org/licenses/by/4.0/

Source JPEG: https://media.springernature.com/lw1200/springer-static/image/art%3A10.1038%2Fncomms10980/MediaObjects/41467_2016_Article_BFncomms10980_Fig4_HTML.jpg

cell-data.js extracts matched 128×128 interior crops from the published insets, red channel only, displayed in grayscale. This is a compressed published figure, not raw instrument data. Interactive Fourier filtering uses the SIM crop as a reference and does not perform SIM reconstruction or infer a physical NA. Reported raw data are not modified.


## Current actin reference
Mo, Y., Wang, K., Li, L. et al. (2023). Quantitative structured illumination microscopy via a physical model-based background filtering algorithm reveals actin dynamics. Nature Communications. https://doi.org/10.1038/s41467-023-38808-8

Figure 1b: LifeAct-EGFP labeled COS-7 cell; crop wholly within the BF-SIM portion. CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ (license verified in article).
Source: https://media.springernature.com/full/springer-static/image/art%3A10.1038%2Fs41467-023-38808-8/MediaObjects/41467_2023_38808_Fig1_HTML.png
Original PNG 1501 × 2384. Crop box (240, 930, 576, 1266), green channel, Lanczos resampled to 256 × 256; no contrast normalization. Embedded in cell-data.js for offline FFT processing; crop saved as actin-crop.png. Full figure retained as actin-source.png.
The low-pass and multi-region images are educational computations from this published reference, not acquired widefield data or new experimental SIM reconstructions. Old fairSIM pore figure is retained as an unused prior reference.
