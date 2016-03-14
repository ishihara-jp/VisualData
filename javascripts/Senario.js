//シナリオモード
function senarioDemo(_senario, fromPt, toPt){

    var SecPerYear = ANIMATION_TIME/35 + 350*2;
    var HighlightTime = SecPerYear * 0.3;
        
    //1982
    setTimeout(function(){
        filterByCompany("NEC");
        _senario
            .attr("transform", "translate(" + fromPt + ")")
            .text("NEC：PC-9800シリーズ発売")
            .ease("elastic")
            .attr("transform", "translate(" + toPt + ")");
        
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);

    },SecPerYear);

    //1983
    setTimeout(function(){
        filterByCompany("CASIO");
        _senario.text("カシオ：腕時計「G-SHOCK」発売");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*2);

    //1984
    setTimeout(function(){
        filterByCompany("KYOCERA");
        _senario.text("京セラ：第二電電（DDI）設立。後にKDD、IDOと合併し、KDDIとなる");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*3);

    //1985
    setTimeout(function(){
        filterByCompany("TOSHIBA");
        filterByCompany("INTEL");
        _senario.text("インテル：DRAM事業撤退。CPUの開発・生産に経営資源を集中　/　東芝：世界初1メガDRAM開発。メモリ開発分野で世界トップへ");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime*1.5);
    },SecPerYear*4);

    //1986
    setTimeout(function(){
        filterByCompany("FUJIFILM");
        _senario.text("富士フィルム：レンズ付きフィルム「写ルンです」発売");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*5);

    //1987
    setTimeout(function(){
        filterByCompany("NEC");
        _senario.text("NEC：家庭用ゲーム機「PCエンジン」発売");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*6);

    //1988
    setTimeout(function(){
        filterByCompany("PANASONIC");
        _senario.text("パナソニック：家電を「National」ブランドから「Panasonic」ブランドへ移行");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*7);

    //1989
    setTimeout(function(){
        filterByCompany("SONY");
        _senario.text("ソニー：コロンビア・ピクチャーズ・エンタテイメントを買収し映画事業に参入");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*8);

    //1990
    setTimeout(function(){
        filterByCompany("PIONEER");
        _senario.text("パイオニア：世界初のGPSカーナビゲーション発売");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*9);

    //1991
    setTimeout(function(){
        filterByCompany("IBM");
        _senario.text("IBM：メインフレームの業績悪化により49億ドルの損失発表。当時、米国史上最悪値を記録");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*10);

    //1992
    setTimeout(function(){
        _senario.text("日本ではバブル景気崩壊");
    },SecPerYear*11);

    //1993
    setTimeout(function(){
        filterByCompany("INTEL");
        _senario.text("インテル：x86向け第5世代CPU「Pentium」を発売");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*12);

    //1994
    setTimeout(function(){
        filterByCompany("SONY");
        _senario.text("ソニー：家庭用ゲーム機「PlayStation」発売");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*13);

    //1995
    setTimeout(function(){
        filterByCompany("MICROSOFT");
        _senario.text("マイクロソフト：Windows 95 発売");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*14);

    //1996
    setTimeout(function(){
        filterByCompany("ERICSSON");
        _senario.text("エリクソン：ソニーと合弁でソニー・エリクソン設立。携帯事業へ進出");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*15);

    //1997
    setTimeout(function(){
        filterByCompany("APPLE");
        _senario.text("アップル：スティーブ・ジョブズ復帰。iMac発表やロゴデザイン一新など新生Appleを印象付ける");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*16);

    //1998
    setTimeout(function(){
        filterByCompany("NOKIA");
        _senario.text("ノキア：エリクソン等と共同でシンビアン社設立。同社OSは日本のフューチャーフォンに多く採用。13年間にわたり携帯シェア世界トップに君臨");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime*1.5);
    },SecPerYear*17);

    //1999
    setTimeout(function(){
        filterByCompany("MICROSOFT");
        _senario.text("マイクロソフト：1999年12月30日 時価総額が史上最高額を塗り替える");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*18);

    //2000
    setTimeout(function(){
        filterByCompany("CISCO");
        _senario.text("シスコ：時価総額5,000億US$に達し、マイクロソフトを抜き世界一");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*19);

    //2001
    setTimeout(function(){
        _senario.text("ITバブル崩壊。その後、「選択と集中」の名のもと、電機業界の再編が加速してゆく");
    },SecPerYear*20);

    //2002
    setTimeout(function(){
        filterByCompany("HP");
        _senario.text("HP：コンピュータ大手コンパックを買収");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*21);

    //2003
    setTimeout(function(){
        filterByCompany("HITACHI");
        _senario.text("日立：IBM HDD部門を買収。三菱電機と半導体合弁ルネサステクノロジ設立");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*22);

    //2004
    setTimeout(function(){
        filterByCompany("LENOVO");
        _senario.text("レノボ：IBM PC部門を買収");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*23);

    //2005
    setTimeout(function(){
        filterByCompany("SIEMENS");
        _senario.text("シーメンス：携帯部門を台湾BenQへ売却");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*24);

    //2006
    setTimeout(function(){
        filterByCompany("TOSHIBA");
        _senario.text("東芝：米ウェスティングハウス買収。原子力発電世界三大メーカーの一角へ");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*25);

    //2007
    setTimeout(function(){
        filterByCompany("APPLE");
        _senario.text("アップル：iPhone 発表");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*26);

    //2008
    setTimeout(function(){
        _senario.text("リーマンショックによる世界金融危機。スマホ時代の幕開けとともに、多くの国内メーカーの携帯事業が失速");
    },SecPerYear*27);

    //2009
    setTimeout(function(){
        filterReset();
        setDisplayAll();

        filterByCompany("SANYO");
        _senario.text("三洋電機：パナソニックによる完全子会社化が決定");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*28);

    //2010
    setTimeout(function(){
        filterByCompany("ORACLE");
        _senario.text("オラクル：Javaやワークステーションで知られる米IT大手サン・マイクロシステムズ買収");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*29);

    //2011
    setTimeout(function(){
        filterByCompany("FUJITSU");
        _senario.text("富士通：理研と共同でスーパーコンピュータ「京」を開発。世界一を奪還");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*30);

    //2012
    setTimeout(function(){
        filterByCompany("APPLE");
        filterByCompany("SAMSUNG");
        _senario.text("アップルは時価総額世界1位に。サムスンとアップルの特許訴訟は泥仕合の様相へ");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime*1.5);
    },SecPerYear*31);

    //2013
    setTimeout(function(){
        filterByCompany("DELL");
        _senario.text("デル：上場廃止。非公開株化");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*32);

    //2014
    setTimeout(function(){
        filterByCompany("LENOVO");
        filterByCompany("NOKIA");
        _senario.text("ノキア：携帯部門をマイクロソフトへ売却　／　レノボ：Googleから携帯部門モトローラ・モビリティを買収");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime*1.5);
    },SecPerYear*33);

    //2015
    setTimeout(function(){
        filterByCompany("TOSHIBA");
        _senario.text("東芝：不適切会計問題発覚");
        setTimeout(function(){
            _senario.text("");
            filterReset();
            setDisplayAll();
        }, HighlightTime);
    },SecPerYear*34);

}
