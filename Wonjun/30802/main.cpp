/* ************************************************************************** */
/*                                                                            */
/*                                                      :::    :::    :::     */
/*   Problem Number: 30802                             :+:    :+:      :+:    */
/*                                                    +:+    +:+        +:+   */
/*   By: jack0969 <boj.kr/u/jack0969>                +#+    +#+          +#+  */
/*                                                  +#+      +#+        +#+   */
/*   https://boj.kr/30802                          #+#        #+#      #+#    */
/*   Solved: 2025/09/10 23:23:42 by jack0969      ###          ###   ##.kr    */
/*                                                                            */
/* ************************************************************************** */
#include <iostream>
using namespace std;

int main(){
    int N;
    int S, M, L, XL , XXL, XXXL;
    int T, P;
    cin >> N >> S >> M >> L >> XL >> XXL >> XXXL;
    cin >> T >> P;

    if (T == 0 || P == 0) {
        cout << "T와 P는 0이 아니어야 합니다." << endl;
        return 1;
    }

    // 티셔츠 묶음 계산
    int tshirt_bundles = 0;
    tshirt_bundles += (S + T - 1) / T;
    tshirt_bundles += (M + T - 1) / T;
    tshirt_bundles += (L + T - 1) / T;
    tshirt_bundles += (XL + T - 1) / T;
    tshirt_bundles += (XXL + T - 1) / T;
    tshirt_bundles += (XXXL + T - 1) / T;

    // 펜 묶음 계산
    int pen_bundles = N / P;
    int pen_singles = N % P;

    cout << tshirt_bundles << "\n";
    cout << pen_bundles << " " << pen_singles;
    return 0;
}