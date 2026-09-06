package com.antifada.app;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static boolean isImmersiveGameplayActive = false;
    private final Handler immersiveHandler = new Handler(Looper.getMainLooper());
    private final Runnable reapplyImmersiveRunnable = this::applyImmersiveMode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.addJavascriptInterface(new AndroidImmersiveInterface(), "AndroidImmersive");
            }
        } catch (Exception ignored) {
        }
    }

    public class AndroidImmersiveInterface {
        @JavascriptInterface
        public void setImmersiveMode(boolean enable) {
            isImmersiveGameplayActive = enable;
            runOnUiThread(() -> {
                if (enable) {
                    applyImmersiveMode();
                } else {
                    restoreNormalSystemUi();
                }
            });
        }

        @JavascriptInterface
        public void pingInteraction() {
            if (isImmersiveGameplayActive) {
                immersiveHandler.removeCallbacks(reapplyImmersiveRunnable);
                immersiveHandler.postDelayed(reapplyImmersiveRunnable, 1000);
            }
        }
    }

    private void applyImmersiveMode() {
        if (!isImmersiveGameplayActive) return;

        Window window = getWindow();
        if (window == null) return;

        View decorView = window.getDecorView();

        WindowCompat.setDecorFitsSystemWindows(window, false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        if (controller != null) {
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.hide(WindowInsetsCompat.Type.statusBars());
            controller.hide(WindowInsetsCompat.Type.navigationBars());
            controller.hide(WindowInsetsCompat.Type.captionBar());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            int flags = View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN;
            decorView.setSystemUiVisibility(flags);
        }
    }

    private void restoreNormalSystemUi() {
        Window window = getWindow();
        if (window == null) return;

        View decorView = window.getDecorView();

        WindowCompat.setDecorFitsSystemWindows(window, true);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        if (controller != null) {
            controller.show(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_DEFAULT);
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && isImmersiveGameplayActive) {
            applyImmersiveMode();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (isImmersiveGameplayActive) {
            applyImmersiveMode();
        }
    }
}
