package com.sancheng.app;

import android.graphics.Color;
import android.os.Build;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ThemeBars")
public class ThemeBarsPlugin extends Plugin {

    @PluginMethod
    public void setColors(PluginCall call) {
        String status = call.getString("status", "#f4efe4");
        String navigation = call.getString("navigation", status);
        boolean light = Boolean.TRUE.equals(call.getBoolean("light", true));

        getActivity().runOnUiThread(() -> {
            try {
                Window window = getActivity().getWindow();
                window.setStatusBarColor(Color.parseColor(status));
                window.setNavigationBarColor(Color.parseColor(navigation));
                window.getDecorView().setBackgroundColor(Color.TRANSPARENT);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    window.setNavigationBarContrastEnforced(false);
                }

                WindowInsetsControllerCompat controller =
                    WindowCompat.getInsetsController(window, window.getDecorView());
                controller.setAppearanceLightStatusBars(light);
                controller.setAppearanceLightNavigationBars(light);

                call.resolve();
            } catch (IllegalArgumentException error) {
                call.reject("Invalid bar color", error);
            }
        });
    }
}
