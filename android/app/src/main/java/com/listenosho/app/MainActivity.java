package com.listenosho.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SystemChromePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
