hi default link IsaDecorationBackgroundIntensify Normal
hi default link IsaDecorationBackgroundQuoted Normal
hi default link IsaDecorationBackgroundAntiquoted Normal
hi default link IsaDecorationBackgroundMarkdownBullet1 Normal
hi default link IsaDecorationBackgroundMarkdownBullet2 Normal
hi default link IsaDecorationBackgroundMarkdownBullet3 Normal
hi default link IsaDecorationBackgroundMarkdownBullet4 Normal
hi default link IsaDecorationForegroundQuoted Normal
hi default link IsaDecorationForegroundAntiquoted Normal

" Alacritty (my terminal emulator of choice) does not have support
" for undercurl yet.
"
" https://github.com/alacritty/alacritty/pull/4660
hi default IsaDecorationDottedWriteln cterm=underline
hi default IsaDecorationDottedInformation cterm=underline
hi default IsaDecorationDottedWarning cterm=underline

" PIDE also displays this as strings, so I think this is ok
hi default IsaDecorationTextMain ctermfg=237 ctermbg=254

hi default link IsaDecorationTextKeyword1 Normal
hi default IsaDecorationTextKeyword2 cterm=bold ctermfg=70
hi default link IsaDecorationTextKeyword3 Normal

hi default link IsaDecorationTextQuasiKeyword Keyword
hi default link IsaDecorationTextImproper Normal
hi default link IsaDecorationTextOperator Keyword
hi default link IsaDecorationTextTfree Normal
hi default link IsaDecorationTextTvar Normal
hi default IsaDecorationTextFree ctermfg=21 ctermbg=254
hi default IsaDecorationTextSkolem ctermfg=179
hi default IsaDecorationTextBound ctermfg=28 ctermbg=254
hi default link IsaDecorationTextVar Identifier
hi default link IsaDecorationTextInnerNumeral Number
hi default link IsaDecorationTextInnerQuoted Normal
hi default link IsaDecorationTextInnerCartouche Normal
hi default link IsaDecorationTextInnerComment Comment
hi default link IsaDecorationTextDynamic Normal
hi default link IsaDecorationTextClassParameter Normal
hi default link IsaDecorationTextAntiquote Normal


" Emulate PIDE colors here
hi default IsaDecorationBackgroundUnprocessed1 ctermbg=223
hi default IsaDecorationTextOverviewUnprocessed ctermbg=223
hi default IsaDecorationBackgroundRunning1 ctermbg=105
hi default IsaDecorationTextOverviewRunning ctermbg=105


hi default IsaDecorationTextOverviewError ctermbg=202
hi default IsaDecorationBackgroundBad ctermbg=202

hi default link IsaDecorationTextOverviewWarning ctermbg=179
hi default link IsaDecorationSpellChecker Normal
