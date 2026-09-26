package com.listenosho.app;

import android.content.res.Configuration;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Paints the strips behind the status and navigation bars to match the page.
 * The WebView sits between the bars (SystemBars insetsHandling "native"), so those strips show the
 * window's decor view, which is otherwise the theme's white window background.
 */
@CapacitorPlugin(name = "SystemChrome")
public class SystemChromePlugin extends Plugin {

    private Integer color;
    private boolean dark;

    @PluginMethod
    public void setColor(PluginCall call) {
        String value = call.getString("color");
        int parsed;
        try {
            parsed = Color.parseColor(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            call.reject("Invalid color: " + value);
            return;
        }

        color = parsed;
        dark = call.getBoolean("dark", false);
        getBridge().executeOnMainThread(() -> {
            apply();
            call.resolve();
        });
    }

    @Override
    protected void handleOnConfigurationChanged(Configuration newConfig) {
        super.handleOnConfigurationChanged(newConfig);

        // SystemBars resets the background and icon style on configuration changes, so apply ours after it
        getActivity().getWindow().getDecorView().post(this::apply);
    }

    private void apply() {
        if (color == null) {
            return;
        }

        Window window = getActivity().getWindow();
        View decorView = window.getDecorView();
        decorView.setBackgroundColor(color);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        controller.setAppearanceLightStatusBars(!dark);
        controller.setAppearanceLightNavigationBars(!dark);
    }
}
